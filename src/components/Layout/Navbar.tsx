import { Search, Home, Tag, Menu, Mail, Plus } from "lucide-react";
import { Link } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

interface NavbarProps {
  searchValue: string;
  onSearchChange: (value: string) => void;
  onSearchSubmit: (value: string) => void;
  onToggleSidebar?: () => void;
}

export function Navbar({
  searchValue,
  onSearchChange,
  onSearchSubmit,
  onToggleSidebar,
}: NavbarProps) {
  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onSearchSubmit(searchValue.trim());
  };

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    onSearchChange(event.target.value);
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link
          to="/"
          className="flex items-center space-x-2 transition-opacity hover:opacity-80"
        >
          <img
            src="https://turkyapimi.com/static/turkyapimi_logo.min.png"
            alt="turkyapimi.com logo"
            className="h-8 w-8 object-contain"
          />
          <span className="hidden text-xl font-bold text-gradient sm:block">
            turkyapimi.com
          </span>
        </Link>

        <form onSubmit={handleSubmit} className="mx-4 flex-1 max-w-md">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Oyun ara..."
              value={searchValue}
              onChange={handleInputChange}
              className="search-bar w-full pl-10"
            />
          </div>
        </form>

        <nav className="hidden items-center space-x-2 md:flex">
          <Button variant="ghost" size="sm" asChild>
            <Link to="/" className="flex items-center space-x-2">
              <Home className="h-4 w-4" />
              <span>Anasayfa</span>
            </Link>
          </Button>
          <Button variant="ghost" size="sm" onClick={onToggleSidebar}>
            <Tag className="h-4 w-4" />
            <span>Kategoriler</span>
          </Button>
          <Button variant="ghost" size="sm" asChild>
            <Link to="/iletisim" className="flex items-center space-x-2">
              <Mail className="h-4 w-4" />
              <span>Iletisim</span>
            </Link>
          </Button>
          <Button size="sm" className="shadow-sm" asChild>
            <Link to="/oyun-ekle" className="flex items-center space-x-2">
              <Plus className="h-4 w-4" />
              <span>Oyun Ekle</span>
            </Link>
          </Button>
        </nav>

        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost" size="sm" className="md:hidden">
              <Menu className="h-4 w-4" />
              <span className="sr-only">Menuyu Ac</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-64">
            <nav className="mt-6 flex flex-col space-y-4">
              <Button variant="ghost" className="justify-start" asChild>
                <Link to="/">
                  <Home className="mr-2 h-4 w-4" />
                  Anasayfa
                </Link>
              </Button>
              <Button
                variant="ghost"
                className="justify-start"
                onClick={onToggleSidebar}
              >
                <Tag className="mr-2 h-4 w-4" />
                Kategoriler
              </Button>
              <Button variant="ghost" className="justify-start" asChild>
                <Link to="/iletisim">
                  <Mail className="mr-2 h-4 w-4" />
                  Iletisim
                </Link>
              </Button>
              <Button className="justify-start" asChild>
                <Link to="/oyun-ekle">
                  <Plus className="mr-2 h-4 w-4" />
                  Oyun Ekle
                </Link>
              </Button>
            </nav>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
}


