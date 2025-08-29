
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { Shield, AlertTriangle } from 'lucide-react';
import { validatePasswordStrength, formatSecureErrorMessage, sanitizeInput, RateLimiter } from '@/utils/security';

const Auth = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [rateLimiter] = useState(() => new RateLimiter());
  const navigate = useNavigate();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session) {
        navigate('/');
      }
    });

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        navigate('/');
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (rateLimiter.isRateLimited(email)) {
      toast.error('Trop de tentatives. Veuillez attendre avant de réessayer');
      return;
    }

    const passwordValidation = validatePasswordStrength(password);
    if (!passwordValidation.isStrong) {
      toast.error('Le mot de passe ne respecte pas les critères de sécurité');
      return;
    }

    setLoading(true);

    const sanitizedEmail = sanitizeInput(email);

    const { error } = await supabase.auth.signUp({
      email: sanitizedEmail,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/`
      }
    });

    if (error) {
      toast.error(formatSecureErrorMessage(error));
    } else {
      toast.success('Vérifiez votre email pour confirmer votre inscription !');
      rateLimiter.reset(email); // Reset on success
    }
    setLoading(false);
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (rateLimiter.isRateLimited(email)) {
      toast.error('Trop de tentatives. Veuillez attendre avant de réessayer');
      return;
    }

    setLoading(true);

    const sanitizedEmail = sanitizeInput(email);

    const { error } = await supabase.auth.signInWithPassword({
      email: sanitizedEmail,
      password,
    });

    if (error) {
      toast.error(formatSecureErrorMessage(error));
    } else {
      toast.success('Connexion réussie !');
      rateLimiter.reset(email); // Reset on success
    }
    setLoading(false);
  };

  const passwordValidation = validatePasswordStrength(password);
  const rateLimited = rateLimiter.isRateLimited(email);

  return (
    <div className="min-h-screen bg-gradient-running flex items-center justify-center p-6">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-gray-800">RunTracker Pro</CardTitle>
          <CardDescription>Connectez-vous pour accéder à vos données Strava</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="signin" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="signin">Connexion</TabsTrigger>
              <TabsTrigger value="signup">Inscription</TabsTrigger>
            </TabsList>
            
            <TabsContent value="signin">
              {rateLimited && (
                <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-yellow-600" />
                  <span className="text-sm text-yellow-700">
                    Trop de tentatives. Veuillez attendre avant de réessayer.
                  </span>
                </div>
              )}
              
              <form onSubmit={handleSignIn} className="space-y-4">
                <div>
                  <Input
                    type="email"
                    placeholder="Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <Input
                    type="password"
                    placeholder="Mot de passe"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
                <Button type="submit" className="w-full" disabled={loading || rateLimited}>
                  {loading ? 'Connexion...' : 'Se connecter'}
                </Button>
              </form>
            </TabsContent>
            
            <TabsContent value="signup">
              {rateLimited && (
                <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-yellow-600" />
                  <span className="text-sm text-yellow-700">
                    Trop de tentatives. Veuillez attendre avant de réessayer.
                  </span>
                </div>
              )}
              
              <form onSubmit={handleSignUp} className="space-y-4">
                <div>
                  <Input
                    type="email"
                    placeholder="Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <Input
                    type="password"
                    placeholder="Mot de passe"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={8}
                  />
                  
                  {password && (
                    <div className="mt-2 p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <Shield className={`h-4 w-4 ${passwordValidation.isStrong ? 'text-green-600' : 'text-orange-600'}`} />
                        <span className={`text-sm font-medium ${passwordValidation.isStrong ? 'text-green-700' : 'text-orange-700'}`}>
                          Sécurité du mot de passe: {passwordValidation.score}/5
                        </span>
                      </div>
                      
                      <div className="space-y-1 text-xs">
                        <div className={`flex items-center gap-1 ${passwordValidation.requirements.length ? 'text-green-600' : 'text-gray-500'}`}>
                          <span>{passwordValidation.requirements.length ? '✓' : '○'}</span>
                          Au moins 8 caractères
                        </div>
                        <div className={`flex items-center gap-1 ${passwordValidation.requirements.uppercase ? 'text-green-600' : 'text-gray-500'}`}>
                          <span>{passwordValidation.requirements.uppercase ? '✓' : '○'}</span>
                          Une majuscule
                        </div>
                        <div className={`flex items-center gap-1 ${passwordValidation.requirements.lowercase ? 'text-green-600' : 'text-gray-500'}`}>
                          <span>{passwordValidation.requirements.lowercase ? '✓' : '○'}</span>
                          Une minuscule
                        </div>
                        <div className={`flex items-center gap-1 ${passwordValidation.requirements.number ? 'text-green-600' : 'text-gray-500'}`}>
                          <span>{passwordValidation.requirements.number ? '✓' : '○'}</span>
                          Un chiffre
                        </div>
                        <div className={`flex items-center gap-1 ${passwordValidation.requirements.special ? 'text-green-600' : 'text-gray-500'}`}>
                          <span>{passwordValidation.requirements.special ? '✓' : '○'}</span>
                          Un caractère spécial
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                
                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={loading || rateLimited || (password && !passwordValidation.isStrong)}
                >
                  {loading ? 'Inscription...' : "S'inscrire"}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;
