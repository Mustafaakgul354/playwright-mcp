# 🚀 Playwright MCP - Kurulum ve Başlangıç Rehberi

## 📦 Kurulum Adımları

### 1. Proje Bağımlılıklarını Yükle
```bash
npm install
```

### 2. Sunucuyu Test Et
```bash
npm start
```

Sunucu başarıyla çalışıyorsa aşağıdaki çıktıyı göreceksiniz:
```
🚀 Playwright MCP Sunucusu çalışıyor...
```

## 🔧 Konfigürasyon

### MCP Sunucusunun Cursor ile Entegrasyonu

`~/.cursor/mcp.json` dosyasında:

```json
{
  "mcpServers": {
    "playwright": {
      "command": "npx",
      "args": ["@playwright/mcp@latest"]
    }
  }
}
```

**✅ Zaten yapılmış!**

## 📚 Kullanılabilir Araçlar

Sunucu aşağıdaki araçları LLM'lere sunar:

| Araç | Açıklama |
|------|----------|
| `launch_browser` | Chromium/Firefox/WebKit başlat |
| `navigate` | URL'ye git |
| `click` | Element tıkla |
| `fill` | Input'a metin gir |
| `fill_form` ⭐ **YENİ** | Birden fazla form alanını doldur |
| `select_option` ⭐ **YENİ** | Select dropdown seç |
| `check_element` ⭐ **YENİ** | Checkbox/Radio seç |
| `screenshot` | Ekran görüntüsü al |
| `get_html` | Sayfa HTML'ini al |
| `close_browser` | Tarayıcı kapat |

## 💡 Örnek Kullanım

### JavaScript ile (Doğrudan)
```bash
node examples/basic-automation.js
```

### LLM Agent ile (MCP)
Claude gibi LLM'lere `playwright` sunucusu erişimini vererek, LLM'in web otomasyonu yapmasını sağlayabilirsiniz.

**Örnek 1 - Arama İstemi:**
```
Lütfen Google'da "Playwright automation" için arama yap ve ekran görüntüsünü al.
```

LLM şu adımları otomatik olarak yapacaktır:
1. Tarayıcıyı başlatır
2. Google'a gider
3. Arama yapar
4. Ekran görüntüsünü kaydeder

**Örnek 2 - Form Doldurma İstemi:**
```
Lütfen bir kayıt formunu şu bilgilerle doldur:
- Ad: John Doe
- Email:  
- Telefon: +90 555 123 4567
- Ülke: Turkey
- Şartları Kabul Et: Evet

Doldurduktan sonra gönder ve ekran görüntüsü al.
```

LLM şu adımları yapacaktır:
1. Tarayıcıyı başlatır
2. Form sayfasına gider
3. `fill_form` aracını kullanarak tüm alanları doldurur
4. `select_option` ile ülkeyi seçer
5. `check_element` ile checkbox'ı işaretler
6. Gönder butonuna tıklar
7. Ekran görüntüsünü kaydeder

## 🎯 Sonraki Adımlar

1. **Daha Fazla Araç Ekle**
   - Form doldurma
   - Network mock'u
   - Beklemeleri özelleştir
   - PDF oluştur

2. **Güvenlik Özellikleri**
   - Başlangıç kontrolleri
   - Rate limiting
   - Zaman aşımı yönetimi

3. **Logging ve Monitoring**
   - İstek/Yanıt logları
   - Performance metrikleri
   - Hata raporlaması

4. **Test Suite**
   - MCP araçlarının testleri
   - Entegrasyon testleri
   - Performance testleri

## 📝 Notlar

- **Headless Mod**: Varsayılan olarak `headless: true` (tarayıcı görüntüsü gösterilmez)
- **Zaman Aşımı**: 30 saniye varsayılan timeout
- **Memory**: Uzun oturumlar için browser profil yönetimi gerekli olabilir

## 🆘 Sorun Giderme

### Port Hatası
```bash
# Eğer port 3000 kullanılıyorsa
lsof -i :3000
kill -9 <PID>
```

### Playwright Playwright Browser Kurulumu
```bash
npx playwright install
```

### Bağımlılık Sorunları
```bash
rm -rf node_modules package-lock.json
npm install
```

---

**Her şey hazır! Şimdi automation yazabilirsiniz.** 🎉

