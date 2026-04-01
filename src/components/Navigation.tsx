import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Utensils, User, LogOut, Heart, HeartPulse } from "lucide-react";
import { toast } from "sonner";
import type { User as SupabaseUser } from "@supabase/supabase-js";

interface Profile {
  username: string;
  avatar_url: string | null;
}

const Navigation = () => {
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const location = useLocation();

  const isRecovery = location.pathname.startsWith("/recovery");

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) fetchProfile(session.user.id);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) fetchProfile(session.user.id);
      else setProfile(null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchProfile = async (userId: string) => {
    const { data } = await supabase
      .from("profiles")
      .select("username, avatar_url")
      .eq("user_id", userId)
      .single();
    if (data) setProfile(data);
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    toast.success("Signed out successfully");
  };

  return (
    <nav className={`border-b backdrop-blur supports-[backdrop-filter]:bg-background/60 ${
      isRecovery ? "bg-secondary/5 border-secondary/20" : "bg-background/95"
    }`}>
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 font-semibold text-xl">
          <Utensils className="w-6 h-6 text-primary" />
          NutriChef
        </Link>

        <div className="flex items-center gap-2 sm:gap-4">
          <Link to="/">
            <Button
              variant={!isRecovery ? "secondary" : "ghost"}
              size="sm"
            >
              <Utensils className="w-4 h-4 mr-1 sm:mr-2" />
              <span className="hidden sm:inline">Recipes</span>
            </Button>
          </Link>
          <Link to="/recovery">
            <Button
              variant={isRecovery ? "secondary" : "ghost"}
              size="sm"
            >
              <HeartPulse className="w-4 h-4 mr-1 sm:mr-2" />
              <span className="hidden sm:inline">Recovery</span>
            </Button>
          </Link>
          {user ? (
            <>
              <Link to="/my-recipes">
                <Button variant="ghost" size="sm">
                  <Heart className="w-4 h-4 mr-1 sm:mr-2" />
                  <span className="hidden sm:inline">My Recipes</span>
                </Button>
              </Link>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-10 w-10 rounded-full" aria-label="User menu">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={profile?.avatar_url || ""} alt={profile?.username || "User"} />
                      <AvatarFallback>
                        <User className="w-5 h-5" />
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">{profile?.username || "User"}</p>
                      <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut}>
                    <LogOut className="w-4 h-4 mr-2" />
                    Sign out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <Link to="/auth">
              <Button size="sm">Sign In</Button>
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navigation;
