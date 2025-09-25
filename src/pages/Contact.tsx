import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { Mail, MessageCircle, Send, Twitter, Clock, MapPin } from "lucide-react";

import { Navbar } from "@/components/Layout/Navbar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { toast } from "@/components/ui/use-toast";

interface ContactFormState {
  name: string;
  email: string;
  subject: string;
  message: string;
}

const initialFormState: ContactFormState = {
  name: "",
  email: "",
  subject: "",
  message: "",
};

export default function Contact() {
  const navigate = useNavigate();

  const [formState, setFormState] = useState<ContactFormState>(initialFormState);
  const [submitting, setSubmitting] = useState(false);
  const [searchValue, setSearchValue] = useState("");

  const handleFieldChange = (field: keyof ContactFormState) =>
    (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setFormState((previous) => ({
        ...previous,
        [field]: event.target.value,
      }));
    };

  const handleSearchSubmit = (value: string) => {
    const trimmed = value.trim();

    if (!trimmed) {
      navigate("/");
      return;
    }

    const params = new URLSearchParams();
    params.set("search", trimmed);
    navigate(`/?${params.toString()}`);
  };

  const handleToggleSidebar = () => {
    navigate("/?filters=open");
  };

  const contactEndpoint = import.meta.env.VITE_CONTACT_SUBMIT_URL;

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!formState.name.trim() || !formState.email.trim() || !formState.message.trim()) {
      toast({
        title: "Eksik bilgi",
        description: "Isim, e-posta ve mesaj alanlarini doldurdugundan emin ol.",
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);

    const payload = {
      ...formState,
      submittedAt: new Date().toISOString(),
    };

    const summary = [
      `Gonderen: ${formState.name}`,
      `E-posta: ${formState.email}`,
      `Konu: ${formState.subject || '-'}`,
      ``,
      `Mesaj:`,
      formState.message,
    ].join("\n");

    if (contactEndpoint) {
      try {
        const response = await fetch(contactEndpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          throw new Error(`Request failed with status ${response.status}`);
        }

        toast({
          title: "Mesaj gonderildi",
          description: "Iletisim istegini aldik. En kisa surede donus yapacagiz.",
        });

        setFormState(initialFormState);
        setSubmitting(false);
        return;
      } catch (error) {
        console.error("Contact form submission failed:", error);
      }
    }

    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(summary);
        toast({
          title: "Mesaj panoya kopyalandi",
          description: "Ekip e-postasina manuel olarak iletebilirsin: selam@turkyapimi.com",
        });
      } else {
        toast({
          title: "Mesaj hazir",
          description: "Icerik panoya kopyalanamadi. Asagida on izlemeyi gorebilirsin.",
        });
      }
    } catch (error) {
      console.warn("Clipboard copy failed:", error);
      toast({
        title: "Kopyalama basarisiz",
        description: "Mesaj icerigini manuel olarak secip kopyalayabilirsin.",
        variant: "destructive",
      });
    }

    setSubmitting(false);
  };

  const handleReset = () => {
    setFormState(initialFormState);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar
        searchValue={searchValue}
        onSearchChange={setSearchValue}
        onSearchSubmit={handleSearchSubmit}
        onToggleSidebar={handleToggleSidebar}
      />

      <main className="container mx-auto px-4 py-10">
        <section className="mb-10 grid gap-6 lg:grid-cols-[minmax(0,2fr),minmax(0,1fr)]">
          <Card className="border-primary/20">
            <CardHeader>
              <CardTitle>Iletisim Formu</CardTitle>
              <CardDescription>
                Bize ulasmak icin formu doldur; proje veya is birligi onerilerini degerlendiriyoruz.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form className="space-y-4" onSubmit={handleSubmit}>
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <Label htmlFor="name">Isim *</Label>
                    <Input
                      id="name"
                      required
                      value={formState.name}
                      onChange={handleFieldChange("name")}
                      placeholder="Adin Soyadin"
                    />
                  </div>
                  <div>
                    <Label htmlFor="email">E-posta *</Label>
                    <Input
                      id="email"
                      type="email"
                      required
                      value={formState.email}
                      onChange={handleFieldChange("email")}
                      placeholder="ornek@studiounuz.com"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="subject">Konu</Label>
                  <Input
                    id="subject"
                    value={formState.subject}
                    onChange={handleFieldChange("subject")}
                    placeholder="Orn. Is birligi talebi"
                  />
                </div>
                <div>
                  <Label htmlFor="message">Mesaj *</Label>
                  <Textarea
                    id="message"
                    required
                    value={formState.message}
                    onChange={handleFieldChange("message")}
                    placeholder="Kisa ve net sekilde neye ihtiyacin oldugunu anlat."
                    rows={6}
                  />
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <Button type="submit" disabled={submitting} className="gap-2">
                    <Send className="h-4 w-4" />
                    Gonder
                  </Button>
                  <Button type="button" variant="ghost" onClick={handleReset} disabled={submitting}>
                    Formu temizle
                  </Button>
                  <span className="text-xs text-muted-foreground">
                    * isaretli alanlar zorunludur.
                  </span>
                </div>
              </form>
            </CardContent>
          </Card>

          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Hizli Ulasim</CardTitle>
                <CardDescription>Tercih ettigin kanali secerek ekibe ulasabilirsin.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 text-sm text-muted-foreground">
                <div className="flex items-start gap-3">
                  <Mail className="mt-1 h-4 w-4 text-primary" />
                  <div>
                    <p className="font-medium text-foreground">E-posta</p>
                    <p>selam@turkyapimi.com</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <MessageCircle className="mt-1 h-4 w-4 text-primary" />
                  <div>
                    <p className="font-medium text-foreground">Discord toplulugu</p>
                    <p>Katil: discord.gg/turkyapimi</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Twitter className="mt-1 h-4 w-4 text-primary" />
                  <div>
                    <p className="font-medium text-foreground">Twitter / X</p>
                    <p>@turkyapimi</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>
      </main>
    </div>
  );
}
