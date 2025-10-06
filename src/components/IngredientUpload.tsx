import { useState, useRef } from "react";
import { Upload, X, Loader2 } from "lucide-react";
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
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length + selectedFiles.length > 3) {
      toast.error("You can only upload up to 3 images");
      return;
    }

    setSelectedFiles(prev => [...prev, ...files]);
    
    // Create previews
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
    try {
      // Upload images to storage
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

      // Call AI to extract ingredients
      const { data, error } = await supabase.functions.invoke('extract-ingredients', {
        body: { images: uploadedUrls }
      });

      if (error) throw error;

      if (data?.error) {
        toast.error(data.error);
        return;
      }

      toast.success("Ingredients extracted successfully!");
      onIngredientsExtracted(data.ingredients, uploadedUrls);
    } catch (error) {
      console.error('Error extracting ingredients:', error);
      toast.error("Failed to extract ingredients. Please try again.");
    } finally {
      setIsUploading(false);
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
        />
        
        <div 
          onClick={() => fileInputRef.current?.click()}
          className="cursor-pointer text-center space-y-4"
        >
          <div className="w-20 h-20 mx-auto rounded-full bg-primary/10 flex items-center justify-center">
            <Upload className="w-10 h-10 text-primary" />
          </div>
          <div>
            <h3 className="text-xl font-semibold mb-2">Upload Your Ingredients</h3>
            <p className="text-muted-foreground">
              Click to upload 1-3 photos of your ingredients
            </p>
          </div>
        </div>
      </Card>

      {previews.length > 0 && (
        <div className="grid grid-cols-3 gap-4">
          {previews.map((preview, index) => (
            <div key={index} className="relative group">
              <img
                src={preview}
                alt={`Ingredient ${index + 1}`}
                className="w-full h-32 object-cover rounded-lg shadow-md"
              />
              <button
                onClick={() => removeImage(index)}
                className="absolute top-2 right-2 p-1 bg-destructive text-destructive-foreground rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {selectedFiles.length > 0 && (
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
    </div>
  );
};
