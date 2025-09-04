import { User, LogOut, LogIn } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { Link } from 'react-router-dom';

interface AuthButtonProps {
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'sm' | 'default' | 'lg';
  showText?: boolean;
}

const AuthButton = ({ 
  variant = 'outline', 
  size = 'default',
  showText = true 
}: AuthButtonProps) => {
  const { user, loading, signOut } = useAuth();

  if (loading) {
    return (
      <Button variant={variant} size={size} disabled>
        <div className="w-4 h-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
        {showText && <span className="ml-2">...</span>}
      </Button>
    );
  }

  if (user) {
    return (
      <Button 
        variant={variant} 
        size={size}
        onClick={signOut}
        className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200 hover:border-red-300"
      >
        <LogOut className="w-4 h-4" />
        {showText && <span className="ml-2">Déconnexion</span>}
      </Button>
    );
  }

  return (
    <Button variant={variant} size={size} asChild>
      <Link to="/auth" className="flex items-center">
        <LogIn className="w-4 h-4" />
        {showText && <span className="ml-2">Connexion</span>}
      </Link>
    </Button>
  );
};

export default AuthButton;