import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { Home, Gamepad2 } from "lucide-react";
import { Button } from "@/components/ui/button";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="text-center max-w-md">
        <div className="mb-8">
          <div className="w-24 h-24 mx-auto bg-primary/10 rounded-full flex items-center justify-center mb-4">
            <Gamepad2 className="w-12 h-12 text-primary" />
          </div>
          <h1 className="text-6xl font-bold text-primary mb-2">404</h1>
          <h2 className="text-2xl font-semibold mb-4">Sayfa Bulunamadı</h2>
          <p className="text-muted-foreground mb-8">
            Aradığınız sayfa mevcut değil veya taşınmış olabilir.
          </p>
        </div>
        
        <div className="space-y-4">
          <Button asChild className="w-full">
            <Link to="/">
              <Home className="w-4 h-4 mr-2" />
              Ana Sayfaya Dön
            </Link>
          </Button>
          
          <p className="text-sm text-muted-foreground">
            Türk yapımı oyunları keşfetmeye devam edin!
          </p>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
