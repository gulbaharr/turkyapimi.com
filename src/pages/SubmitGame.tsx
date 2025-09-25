import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Rocket, Loader2 } from "lucide-react";

import { Navbar } from "@/components/Layout/Navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/components/ui/use-toast";
import { fetchTags, type Tag } from "@/lib/api";

type FormData = {
  gameName: string;
  studioName: string;
  contactName: string;
  contactEmail: string;
  contactRole: string;
  releaseStatus: string;
  releaseDate: string;
  platforms: string[];
  shortDescription: string;
  pitch: string;
  highlights: string;
  steamUrl: string;
  websiteUrl: string;
  epicUrl: string;
  gogUrl: string;
  itchUrl: string;
  xboxUrl: string;
  playstationUrl: string;
  nintendoUrl: string;
  mobileUrl: string;
  discordUrl: string;
  twitterUrl: string;
  youtubeUrl: string;
  trailerUrl: string;
  presskitUrl: string;
  additionalNotes: string;
};

const initialFormData: FormData = {
  gameName: "",
  studioName: "",
  contactName: "",
  contactEmail: "",
  contactRole: "",
  releaseStatus: "",
  releaseDate: "",
  platforms: [],
  shortDescription: "",
  pitch: "",
  highlights: "",
  steamUrl: "",
  websiteUrl: "",
  epicUrl: "",
  gogUrl: "",
  itchUrl: "",
  xboxUrl: "",
  playstationUrl: "",
  nintendoUrl: "",
  mobileUrl: "",
  discordUrl: "",
  twitterUrl: "",
  youtubeUrl: "",
  trailerUrl: "",
  presskitUrl: "",
  additionalNotes: "",
};

const releaseStatusOptions = [
  { value: "released", label: "Yayında" },
  { value: "early_access", label: "Erken Erişim" },
  { value: "in_development", label: "Geliştirme Aşamasında" },
  { value: "demo", label: "Demo Yayında" },
];

const platformOptions = [
  "PC (Windows)",
  "PC (macOS)",
  "PC (Linux)",
  "PlayStation",
  "Xbox",
  "Nintendo Switch",
  "Mobil (iOS)",
  "Mobil (Android)",
  "VR"
];

const fallbackEmail = "selam@turkyapimi.com";

function buildMailBody(form: FormData, selectedTags: Tag[]): string {
  const tagList = selectedTags.length > 0
    ? selectedTags.map((tag) => `- ${tag.isim}`).join("\n")
    : "(Henüz etiket seçilmedi)";

  return [`
Oyun Adı: ${form.gameName}
Stüdyo: ${form.studioName}
İlgili Kişi: ${form.contactName || "-"}
İlgili Rol: ${form.contactRole || "-"}
E-posta: ${form.contactEmail || "-"}

Çıkış Durumu: ${releaseStatusOptions.find((option) => option.value === form.releaseStatus)?.label ?? "Belirtilmedi"}
Hedeflenen/Mevcut Çıkış Tarihi: ${form.releaseDate || "-"}
Platformlar: ${form.platforms.length > 0 ? form.platforms.join(", ") : "-"}

Kısa Tanıtım:\n${form.shortDescription || "-"}
Pitch:\n${form.pitch || "-"}
Öne Çıkan Özellikler:\n${form.highlights || "-"}

Bağlantılar:
- Steam: ${form.steamUrl || "-"}
- Website: ${form.websiteUrl || "-"}
- Epic Games: ${form.epicUrl || "-"}
- GOG: ${form.gogUrl || "-"}
- itch.io: ${form.itchUrl || "-"}
- Xbox Store: ${form.xboxUrl || "-"}
- PlayStation Store: ${form.playstationUrl || "-"}
- Nintendo eShop: ${form.nintendoUrl || "-"}
- Mobil Mağaza: ${form.mobileUrl || "-"}

Topluluk & Medya:
- Discord: ${form.discordUrl || "-"}
- Twitter/X: ${form.twitterUrl || "-"}
- YouTube: ${form.youtubeUrl || "-"}
- Fragman: ${form.trailerUrl || "-"}
- Basın Kiti: ${form.presskitUrl || "-"}

Etiket Önerileri:
${tagList}

Ek Notlar:
${form.additionalNotes || "-"}
  `].join("\n");
}

function buildMailtoLink(subject: string, body: string) {
  return `mailto:${fallbackEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

export default function SubmitGame() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [availableTags, setAvailableTags] = useState<Tag[]>([]);
  const [selectedTagSlugs, setSelectedTagSlugs] = useState<string[]>([]);
  const [tagSearch, setTagSearch] = useState("");
  const [loadingTags, setLoadingTags] = useState(true);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [searchValue, setSearchValue] = useState("");

  useEffect(() => {
    const loadTags = async () => {
      try {
        const tags = await fetchTags();
        setAvailableTags(tags);
      } catch (error) {
        console.error("Error loading submission tags:", error);
      } finally {
        setLoadingTags(false);
      }
    };

    loadTags();
  }, []);

  const filteredTags = useMemo(() => {
    const query = tagSearch.trim().toLowerCase();

    if (!query) {
      return availableTags;
    }

    return availableTags.filter((tag) =>
      tag.isim.toLowerCase().includes(query) ||
      tag.slug.toLowerCase().includes(query),
    );
  }, [availableTags, tagSearch]);

  const selectedTags = useMemo(
    () => availableTags.filter((tag) => selectedTagSlugs.includes(tag.slug)),
    [availableTags, selectedTagSlugs],
  );

  const handleFieldChange = (
    field: keyof FormData,
  ) =>
    (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const value = event.target.value;
      setFormData((prev) => ({ ...prev, [field]: value }));
    };

  const handleReleaseStatusChange = (
    event: React.ChangeEvent<HTMLSelectElement>,
  ) => {
    setFormData((prev) => ({ ...prev, releaseStatus: event.target.value }));
  };

  const handlePlatformToggle = (platform: string, checked: boolean) => {
    setFormData((prev) => ({
      ...prev,
      platforms: checked
        ? [...prev.platforms, platform]
        : prev.platforms.filter((item) => item !== platform),
    }));
  };

  const toggleTag = (slug: string) => {
    setSelectedTagSlugs((prev) =>
      prev.includes(slug)
        ? prev.filter((item) => item !== slug)
        : [...prev, slug],
    );
  };

  const resetForm = () => {
    setFormData(initialFormData);
    setSelectedTagSlugs([]);
    setTagSearch("");
  };

  const submissionEndpoint = import.meta.env.VITE_GAME_SUBMIT_URL;

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!formData.gameName || !formData.contactEmail) {
      toast({
        title: "Eksik Bilgi",
        description: "Minimum olarak oyun adı ve iletişim e-postasını paylaşmalısınız.",
        variant: "destructive",
      });
      return;
    }

    setSubmitLoading(true);

    const payload = {
      ...formData,
      tags: selectedTagSlugs,
    };

    const summary = buildMailBody(formData, selectedTags);

    if (submissionEndpoint) {
      try {
        const response = await fetch(submissionEndpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          throw new Error(`Request failed with status ${response.status}`);
        }

        toast({
          title: "Başvuru alındı",
          description: "Oyun bilgilerinizi ekibimize ilettik. En kısa sürede dönüş yapacağız.",
        });
        resetForm();
        setSubmitLoading(false);
        return;
      } catch (error) {
        console.error("Game submission failed:", error);
        toast({
          title: "Otomatik gönderim başarısız",
          description: "E-posta istemcinize yönlendiriyoruz. Başvuru içeriği panonuza kopyalanacak.",
        });
      }
    } else {
      toast({
        title: "E-posta ile gönderim",
        description: "Başvuru bilgileri panonuza kopyalanacak ve e-posta istemciniz açılacak.",
      });
    }

    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(summary);
      }
    } catch (error) {
      console.warn("Clipboard copy failed:", error);
    }

    const subject = `Yeni oyun başvurusu: ${formData.gameName}`;
    const mailto = buildMailtoLink(subject, summary);
    window.location.href = mailto;
    setSubmitLoading(false);
  };

  const handleSearchSubmit = (value: string) => {
    const params = new URLSearchParams();
    if (value.trim()) {
      params.set("search", value.trim());
    }
    navigate(params.size > 0 ? `/?${params.toString()}` : "/");
  };

  const handleToggleSidebar = () => {
    navigate("/?filters=open");
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
        <section className="mb-10 rounded-3xl bg-gradient-to-br from-primary/10 via-primary/5 to-transparent p-8 shadow-sm">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-2xl space-y-4">
              <div className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary">
                <Rocket className="mr-2 h-4 w-4" />
                Oyununu vitrine taşı
              </div>
              <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
                Türk yapımı oyununu turkyapimi.com topluluğuyla paylaş
              </h1>
              <p className="text-base text-muted-foreground">
                Formu doldurarak projenizi vitrinimize eklememize yardımcı olun. Steam/Epic bağlantıları, görseller, fragman ve topluluk linkleri gibi detayları paylaştıkça değerlendirme sürecimiz hızlanır.
              </p>
            </div>
            <Card className="w-full max-w-sm border-primary/20 bg-white/70 shadow-lg backdrop-blur">
              <CardHeader>
                <CardTitle>Hazırlık İpuçları</CardTitle>
                <CardDescription>
                  Başvurunuzun öne çıkması için aşağıdaki materyalleri hazır bulundurun.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-muted-foreground">
                <p>• En az 3 ekran görüntüsü veya kısa bir oynanış videosu</p>
                <p>• Güncel Steam veya mağaza sayfası bağlantısı</p>
                <p>• Basın kiti veya proje hakkında açıklayıcı doküman</p>
                <p>• İletişime geçebileceğimiz aktif bir e-posta adresi</p>
              </CardContent>
            </Card>
          </div>
        </section>

        <div className="grid gap-6 lg:grid-cols-[2fr,1fr]">
          <form onSubmit={handleSubmit} className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Oyun Bilgileri</CardTitle>
                <CardDescription>Vitrinde görünecek temel bilgileri paylaşın.</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4 md:grid-cols-2">
                <div className="md:col-span-2">
                  <Label htmlFor="gameName">Oyun adı *</Label>
                  <Input
                    id="gameName"
                    required
                    value={formData.gameName}
                    onChange={handleFieldChange("gameName")}
                    placeholder="Örn. Midnight Guardians"
                  />
                </div>
                <div>
                  <Label htmlFor="studioName">Stüdyo / ekip adı</Label>
                  <Input
                    id="studioName"
                    value={formData.studioName}
                    onChange={handleFieldChange("studioName")}
                    placeholder="Örn. Anadolu Interactive"
                  />
                </div>
                <div>
                  <Label htmlFor="releaseStatus">Çıkış durumu</Label>
                  <select
                    id="releaseStatus"
                    className="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    value={formData.releaseStatus}
                    onChange={handleReleaseStatusChange}
                  >
                    <option value="">Seçiniz</option>
                    {releaseStatusOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label htmlFor="releaseDate">Hedeflenen / mevcut çıkış tarihi</Label>
                  <Input
                    id="releaseDate"
                    type="date"
                    value={formData.releaseDate}
                    onChange={handleFieldChange("releaseDate")}
                  />
                </div>
                <div className="md:col-span-2">
                  <Label>Platformlar</Label>
                  <div className="mt-3 grid gap-2 sm:grid-cols-2">
                    {platformOptions.map((platform) => {
                      const checked = formData.platforms.includes(platform);
                      return (
                        <label
                          key={platform}
                          className="flex items-center space-x-2 rounded-lg border border-border bg-muted/40 px-3 py-2 text-sm hover:bg-muted"
                        >
                          <Checkbox
                            checked={checked}
                            onCheckedChange={(value) =>
                              handlePlatformToggle(platform, Boolean(value))
                            }
                          />
                          <span>{platform}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
                <div className="md:col-span-2">
                  <Label htmlFor="shortDescription">Kısa tanıtım *</Label>
                  <Textarea
                    id="shortDescription"
                    required
                    value={formData.shortDescription}
                    onChange={handleFieldChange("shortDescription")}
                    placeholder="Bir paragrafta oyununuzun konseptini, türünü ve ayırt edici özelliklerini özetleyin."
                    rows={4}
                  />
                </div>
                <div className="md:col-span-2">
                  <Label htmlFor="pitch">Pitch</Label>
                  <Textarea
                    id="pitch"
                    value={formData.pitch}
                    onChange={handleFieldChange("pitch")}
                    placeholder="Hevesimizi kabartacak kısa bir pitch paylaşabilirsiniz."
                    rows={3}
                  />
                </div>
                <div className="md:col-span-2">
                  <Label htmlFor="highlights">Öne çıkan özellikler</Label>
                  <Textarea
                    id="highlights"
                    value={formData.highlights}
                    onChange={handleFieldChange("highlights")}
                    placeholder="Maksimum 3-5 madde ile oyununuzu benzersiz kılan noktaları yazabilirsiniz."
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>İletişim</CardTitle>
                <CardDescription>İhtiyaç halinde size dönüş yapabilmemiz için iletişim bilgilerinizi ekleyin.</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label htmlFor="contactName">İlgili kişi</Label>
                  <Input
                    id="contactName"
                    value={formData.contactName}
                    onChange={handleFieldChange("contactName")}
                    placeholder="Örn. Ayşe Yılmaz"
                  />
                </div>
                <div>
                  <Label htmlFor="contactRole">İlgili rol</Label>
                  <Input
                    id="contactRole"
                    value={formData.contactRole}
                    onChange={handleFieldChange("contactRole")}
                    placeholder="Örn. PR / Yayıncı İlişkileri"
                  />
                </div>
                <div className="md:col-span-2">
                  <Label htmlFor="contactEmail">E-posta *</Label>
                  <Input
                    id="contactEmail"
                    type="email"
                    required
                    value={formData.contactEmail}
                    onChange={handleFieldChange("contactEmail")}
                    placeholder="iletisim@studyo.com"
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Mağaza & topluluk bağlantıları</CardTitle>
                <CardDescription>Oyun sayfalarını ve topluluk kanallarınızı ekleyin.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <Label htmlFor="steamUrl">Steam</Label>
                    <Input
                      id="steamUrl"
                      type="url"
                      value={formData.steamUrl}
                      onChange={handleFieldChange("steamUrl")}
                      placeholder="https://store.steampowered.com/app/..."
                    />
                  </div>
                  <div>
                    <Label htmlFor="websiteUrl">Resmi web sitesi</Label>
                    <Input
                      id="websiteUrl"
                      type="url"
                      value={formData.websiteUrl}
                      onChange={handleFieldChange("websiteUrl")}
                      placeholder="https://"
                    />
                  </div>
                  <div>
                    <Label htmlFor="epicUrl">Epic Games Store</Label>
                    <Input
                      id="epicUrl"
                      type="url"
                      value={formData.epicUrl}
                      onChange={handleFieldChange("epicUrl")}
                      placeholder="https://store.epicgames.com/..."
                    />
                  </div>
                  <div>
                    <Label htmlFor="gogUrl">GOG</Label>
                    <Input
                      id="gogUrl"
                      type="url"
                      value={formData.gogUrl}
                      onChange={handleFieldChange("gogUrl")}
                      placeholder="https://www.gog.com/..."
                    />
                  </div>
                  <div>
                    <Label htmlFor="itchUrl">itch.io</Label>
                    <Input
                      id="itchUrl"
                      type="url"
                      value={formData.itchUrl}
                      onChange={handleFieldChange("itchUrl")}
                      placeholder="https://studiounuz.itch.io/oyun"
                    />
                  </div>
                  <div>
                    <Label htmlFor="mobileUrl">Mobil mağaza</Label>
                    <Input
                      id="mobileUrl"
                      type="url"
                      value={formData.mobileUrl}
                      onChange={handleFieldChange("mobileUrl")}
                      placeholder="App Store veya Google Play linki"
                    />
                  </div>
                  <div>
                    <Label htmlFor="xboxUrl">Xbox Store</Label>
                    <Input
                      id="xboxUrl"
                      type="url"
                      value={formData.xboxUrl}
                      onChange={handleFieldChange("xboxUrl")}
                      placeholder="https://www.xbox.com/..."
                    />
                  </div>
                  <div>
                    <Label htmlFor="playstationUrl">PlayStation Store</Label>
                    <Input
                      id="playstationUrl"
                      type="url"
                      value={formData.playstationUrl}
                      onChange={handleFieldChange("playstationUrl")}
                      placeholder="https://store.playstation.com/..."
                    />
                  </div>
                  <div>
                    <Label htmlFor="nintendoUrl">Nintendo eShop</Label>
                    <Input
                      id="nintendoUrl"
                      type="url"
                      value={formData.nintendoUrl}
                      onChange={handleFieldChange("nintendoUrl")}
                      placeholder="https://www.nintendo.com/..."
                    />
                  </div>
                </div>

                <Separator />

                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <Label htmlFor="discordUrl">Discord</Label>
                    <Input
                      id="discordUrl"
                      type="url"
                      value={formData.discordUrl}
                      onChange={handleFieldChange("discordUrl")}
                      placeholder="https://discord.gg/..."
                    />
                  </div>
                  <div>
                    <Label htmlFor="twitterUrl">Twitter/X</Label>
                    <Input
                      id="twitterUrl"
                      type="url"
                      value={formData.twitterUrl}
                      onChange={handleFieldChange("twitterUrl")}
                      placeholder="https://twitter.com/..."
                    />
                  </div>
                  <div>
                    <Label htmlFor="youtubeUrl">YouTube</Label>
                    <Input
                      id="youtubeUrl"
                      type="url"
                      value={formData.youtubeUrl}
                      onChange={handleFieldChange("youtubeUrl")}
                      placeholder="https://www.youtube.com/..."
                    />
                  </div>
                  <div>
                    <Label htmlFor="trailerUrl">Fragman linki</Label>
                    <Input
                      id="trailerUrl"
                      type="url"
                      value={formData.trailerUrl}
                      onChange={handleFieldChange("trailerUrl")}
                      placeholder="YouTube veya Vimeo bağlantısı"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <Label htmlFor="presskitUrl">Basın kiti</Label>
                    <Input
                      id="presskitUrl"
                      type="url"
                      value={formData.presskitUrl}
                      onChange={handleFieldChange("presskitUrl")}
                      placeholder="Google Drive, Dropbox veya presskit() bağlantısı"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Etiket önerileri</CardTitle>
                <CardDescription>Oyunun türünü anlatan etiketleri seçebilirsiniz.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Input
                  value={tagSearch}
                  onChange={(event) => setTagSearch(event.target.value)}
                  placeholder="Etiket ara..."
                />
                <ScrollArea className="max-h-64">
                  <div className="flex flex-wrap gap-2">
                    {loadingTags && <p className="text-sm text-muted-foreground">Etiketler yükleniyor...</p>}
                    {!loadingTags && filteredTags.length === 0 && (
                      <p className="text-sm text-muted-foreground">Eşleşen etiket bulunamadı.</p>
                    )}
                    {filteredTags.map((tag) => {
                      const selected = selectedTagSlugs.includes(tag.slug);
                      return (
                        <Badge
                          key={tag.slug}
                          variant={selected ? "default" : "outline"}
                          className="cursor-pointer px-3 py-1"
                          onClick={() => toggleTag(tag.slug)}
                        >
                          #{tag.isim}
                        </Badge>
                      );
                    })}
                  </div>
                </ScrollArea>
                {selectedTags.length > 0 && (
                  <div className="text-sm text-muted-foreground">
                    Seçili etiketler: {selectedTags.map((tag) => tag.isim).join(", ")}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Ek Notlar</CardTitle>
                <CardDescription>Paylaşmak istediğiniz ekstra detayları ekleyin.</CardDescription>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={formData.additionalNotes}
                  onChange={handleFieldChange("additionalNotes")}
                  placeholder="Örn. Basın kitinde ekstra ekran görüntüleri mevcut." rows={4}
                />
              </CardContent>
            </Card>

            <div className="flex flex-col gap-3 rounded-2xl border border-dashed border-primary/40 bg-primary/5 p-6 text-sm text-muted-foreground">
              <p>
                Gönder butonuna bastığınızda veriler öncelikle tanımlı bir API uç noktasına iletilmeye çalışılır. Sunucu hazır değilse, tüm bilgiler otomatik olarak panonuza kopyalanır ve varsayılan e-posta istemciniz açılır.
              </p>
              <div className="flex flex-wrap items-center gap-2">
                <Button type="submit" disabled={submitLoading}>
                  {submitLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Oyunumu gönder
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={resetForm}
                  disabled={submitLoading}
                >
                  Formu temizle
                </Button>
              </div>
            </div>
          </form>

          <aside className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Neden bu kadar detay?</CardTitle>
                <CardDescription>
                  Vitrinde yer alacak oyunları topluluk geri bildirimleriyle birlikte seçiyoruz.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-muted-foreground">
                <p>
                  Eksiksiz bilgiler sayesinde oyununuzu daha hızlı inceleyip yayın takvimimize alabiliyoruz.
                </p>
                <p>
                  Görsel ve video materyalleri, kullanıcılarımıza oyunun atmosferini aktarmamız için kritik önemde.
                </p>
                <p>
                  Eğer yayıncı arayışındaysanız, notlar bölümünde bunu belirtmeniz potansiyel partnerlerle sizi buluşturabilir.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Hızlı ipuçları</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-muted-foreground">
                <p>• Fragman linkleri mümkünse herkese açık olmalı.</p>
                <p>• Steam sayfanız henüz yayında değilse, gizli paylaşım linki ekleyebilirsiniz.</p>
                <p>• Öne çıkarmak istediğiniz topluluk etkinliklerini notlarda belirtin.</p>
              </CardContent>
            </Card>
          </aside>
        </div>
      </main>
    </div>
  );
}
