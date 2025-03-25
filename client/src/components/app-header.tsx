import { HelpCircle, Settings, Menu, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useAuth } from "@/hooks/use-auth";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";

interface AppHeaderProps {
  toggleSidebar: () => void;
}

export function AppHeader({ toggleSidebar }: AppHeaderProps) {
  const { user, logout, isAdmin } = useAuth();
  const { toast } = useToast();

  const handleLogout = async () => {
    try {
      await logout();
      toast({
        title: "Logged out",
        description: "You have been logged out successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to log out",
        variant: "destructive",
      });
    }
  };

  // Generate initials from user's name or use default
  const getInitials = () => {
    if (!user || !user.name) return "U";
    
    const nameParts = user.name.split(" ");
    if (nameParts.length > 1) {
      return `${nameParts[0][0]}${nameParts[1][0]}`.toUpperCase();
    }
    
    return user.name.slice(0, 2).toUpperCase();
  };

  return (
    <header className="bg-white border-b border-gray-200 shadow-sm flex items-center justify-between px-4 py-2 h-14">
      <div className="flex items-center space-x-2">
        <Button 
          variant="ghost" 
          size="icon" 
          className="md:hidden" 
          onClick={toggleSidebar}
        >
          <Menu className="h-5 w-5" />
        </Button>
        <div className="text-primary font-semibold text-xl">DynamicForms</div>
      </div>
      <div className="flex items-center space-x-4">
        <Button variant="ghost" size="icon">
          <HelpCircle className="h-5 w-5 text-gray-600" />
        </Button>
        {isAdmin && (
          <Button variant="ghost" size="icon">
            <Settings className="h-5 w-5 text-gray-600" />
          </Button>
        )}
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Avatar className="h-8 w-8 bg-primary text-white cursor-pointer">
              <AvatarFallback>{getInitials()}</AvatarFallback>
            </Avatar>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>
              {user?.name || "User"}
              {user?.role === "admin" && (
                <span className="text-xs text-muted-foreground ml-1 block">
                  Administrator
                </span>
              )}
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout}>
              <LogOut className="mr-2 h-4 w-4" />
              <span>Log out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
