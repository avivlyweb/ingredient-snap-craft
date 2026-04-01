import { useState, useRef } from "react";
import { Upload, X, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface IngredientUploadProps {
  onIngredientsExtracted: (ingredients: string[], imageUrls: string[]) => void;
}

export const IngredientUpload = ({ onIngredientsExtracted }: IngredientUploadProps) => {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length + selectedFiles.length > 3) {
      toast.error("You can only upload up to 3 images");
      return;
    }
    setError(null);
    setSelectedFiles(prev => [...prev, ...files]);
    files.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviews(prev => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
    setPreviews(prev => prev.filter((_, i) => i !== index));
  };

  const handleExtract = async () => {
    if (selectedFiles.length === 0) {
      toast.error("Please upload at least one image");
      return;
    }

    setIsUploading(true);
    setError(null);
    try {
      const uploadedUrls: string[] = [];
      for (const file of selectedFiles) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random()}.${fileExt}`;
        const { data, error } = await supabase.storage
          .from('ingredient-images')
          .upload(fileName, file);
        if (error) throw error;
        const { data: { publicUrl } } = supabase.storage
          .from('ingredient-images')
          .getPublicUrl(data.path);
        uploadedUrls.push(publicUrl);
      }

      const { data, error } = await supabase.functions.invoke('extract-ingredients', {
        body: { images: uploadedUrls }
      });
      if (error) throw error;
      if (data?.error) {
        setError(data.error);
        return;
      }
      toast.success("Ingredients extracted successfully!");
      onIngredientsExtracted(data.ingredients, uploadedUrls);
    } catch (err) {
      console.error('Error extracting ingredients:', err);
      setError("Failed to extract ingredients. Please try again or add them manually.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleSkipToManual = () => {
    onIngredientsExtracted([], []);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      fileInputRef.current?.click();
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6">
      <Card className="p-8 border-2 border-dashed border-primary/20 bg-gradient-to-br from-background to-muted/20 hover:border-primary/40 transition-colors">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={handleFileSelect}
          className="hidden"
          id="ingredient-upload"
        />

        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          onKeyDown={handleKeyDown}
          className="w-full text-center space-y-4 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-lg p-4"
          aria-label="Upload ingredient photos"
        >
          <div className="w-20 h-20 mx-auto rounded-full bg-primary/10 flex items-center justify-center">
            <Upload className="w-10 h-10 text-primary" />
          </div>
          <div>
            <h3 className="text-xl font-semibold mb-2">Upload Your Ingredients</h3>
            <p className="text-muted-foreground">
              Click or press Enter to upload 1–3 photos of your ingredients
            </p>
          </div>
        </button>
      </Card>

      {previews.length > 0 && (
        <div className="grid grid-cols-3 gap-4">
          {previews.map((preview, index) => (
            <div key={index} className="relative">
              <img
                src={preview}
                alt={`Ingredient ${index + 1}`}
                className="w-full h-32 object-cover rounded-lg shadow-md"
              />
              <Button
                type="button"
                variant="destructive"
                size="icon"
                className="absolute top-2 right-2 h-7 w-7"
                onClick={() => removeImage(index)}
                aria-label={`Remove image ${index + 1}`}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          ))}
        </div>
      )}

      {/* Inline error state */}
      {error && (
        <div className="flex items-start gap-3 p-4 rounded-lg bg-destructive/10 border border-destructive/30 text-sm">
          <AlertCircle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
          <div className="space-y-2">
            <p className="text-destructive font-medium">{error}</p>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={handleExtract}>
                Retry
              </Button>
              <Button size="sm" variant="ghost" onClick={handleSkipToManual}>
                Add manually instead
              </Button>
            </div>
          </div>
        </div>
      )}

      {selectedFiles.length > 0 && !error && (
        <Button
          onClick={handleExtract}
          disabled={isUploading}
          size="lg"
          className="w-full"
        >
          {isUploading ? (
            <>
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              Extracting Ingredients...
            </>
          ) : (
            "Extract Ingredients"
          )}
        </Button>
      )}

      <div className="text-center">
        <p className="text-sm text-muted-foreground mb-3">or</p>
        <Button
          onClick={handleSkipToManual}
          variant="outline"
          size="lg"
          className="w-full"
        >
          Skip & Add Ingredients Manually
        </Button>
      </div>
    </div>
  );
};
