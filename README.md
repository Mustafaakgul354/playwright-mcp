# 🎭 Playwright MCP - Web Automation Server

Resmi Microsoft Playwright MCP Sunucusu kullanarak LLM/Agent'lere web tarayıcı otomasyonu yetenekleri sağlayan MCP sunucusu.

## ✨ Özellikler

- 🌐 **Tarayıcı Kontrolü**: Chromium, Firefox, WebKit üzerinde tam kontrol
- 🔍 **Yapılandırılmış Veri**: Sadece pikseller değil, erişilebilirlik ağacı (accessibility tree)
- 🤖 **LLM/Agent Entegrasyonu**: OpenAI ve diğer LLM'lerle doğrudan entegrasyon
- 🚀 **MCP Protokolü**: Standart Model Context Protocol desteği
- 📦 **Hazır Araçlar**: Navigasyon, tıklama, metin girişi, ekran görüntüsü vb.

## 📋 Araçlar (Tools)

### 1. `launch_browser`
Tarayıcıyı başlatır.

```json
{
  "browser_type": "chromium|firefox|webkit",
  "headless": true
}
```

### 2. `navigate`
Belirtilen URL'ye gider.

```json
{
  "url": "https://example.com"
}
```

### 3. `click`
Belirtilen selektördeki elemanı tıklar.

```json
{
  "selector": "button.submit"
}
```

### 4. `fill`
Input alanına metin girer.

```json
{
  "selector": "input#search",
  "text": "arama metni"
}
```

### 5. `fill_form` ⭐ **YENİ**
Birden fazla form alanını aynı anda doldur.

```json
{
  "fields": [
    {
      "selector": "input#name",
      "value": "John Doe"
    },
    {
      "selector": "input#email",
      "value": "john@example.com"
    },
    {
      "selector": "input#phone",
      "value": "+90 555 123 4567"
    }
  ],
  "wait_time": 500
}
```

### 6. `select_option` ⭐ **YENİ**
Select dropdown'dan seçenek seç.

```json
{
  "selector": "select#country",
  "value": "TR"
}
```

### 7. `check_element` ⭐ **YENİ**
Checkbox veya radio button seç/kaldır.

```json
{
  "selector": "input[type='checkbox']#terms",
  "checked": true
}
```

### 8. `screenshot`
Sayfanın ekran görüntüsünü alır.

```json
{
  "path": "screenshot.png"
}
```

### 9. `get_html`
Sayfanın HTML kodunu döndürür.

### 10. `close_browser`
Tarayıcıyı kapatır.

## 🚀 Kurulum

### 1. Proje klasörüne git
```bash
cd /Users/mustafahudaiakgul/playwright-mcp
```

### 2. Bağımlılıkları yükle
```bash
npm install
```

### 3. Sunucuyu başlat
```bash
npm start
```

veya geliştirme modunda:
```bash
npm run dev
```

## 📝 Kullanım

### Cursor/Claude MCP Entegrasyonu

`mcp.json` dosyasında Playwright sunucusu aktif:

```json
{
  "llm": {
    "provider": "openai",
    "model": "gpt-4"
  },
  "mcpServers": {
    "playwright": {
      "command": "npx",
      "args": ["@playwright/mcp@latest"]
    }
  }
}
```

### Örnek Automation

```javascript
import { chromium } from 'playwright';

const browser = await chromium.launch();
const page = await browser.newPage();

// Google'a git
await page.goto('https://www.google.com');

// Arama yap
await page.fill('input[name="q"]', 'Playwright');
await page.press('input[name="q"]', 'Enter');

// Sonuçları al
const results = await page.locator('div.g a').allTextContents();
console.log(results);

await browser.close();
```
## 📚 Örnekler

Örnekler `examples/` klasöründe bulunmaktadır:

- `basic-automation.js` - Basit arama otomasyonu
- `form-filling.js` - Form doldurma örneği (metin, dropdown, checkbox)

## 🔧 Konfigürasyon

### Environment Variables

`.env` dosyasında:

```env
BROWSER_TYPE=chromium
HEADLESS=true
TIMEOUT=30000
```

## 🎯 Kullanım Senaryoları

1. **Web Scraping**: Yapılandırılmış veri çıkarma
2. **Test Otomasyonu**: E2E testleri yazma ve çalıştırma
3. **Web Türetme**: Websitelerinden bilgi toplama
4. **Form Doldurma**: Otomatik form doldurma
5. **Doğrulama**: Web sayfaları üzerinde doğrulama

## 📖 Kaynaklar

- [Playwright Resmi Dokümantasyon](https://playwright.dev)
- [Model Context Protocol (MCP)](https://modelcontextprotocol.io)
- [Microsoft Playwright MCP GitHub](https://github.com/microsoft/playwright-mcp)

## 📄 Lisans

ISC

---

**Sorular veya katkılar için:** GitHub issue'ları açabilirsiniz.



