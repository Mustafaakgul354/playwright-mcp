#!/usr/bin/env node
/**
 * Playwright MCP Server
 * 
 * Bu sunucu, Playwright tarayıcı otomasyon yeteneklerini
 * Model Context Protocol (MCP) üzerinden LLM/agent'lere sunar.
 */

import { Server } from '@playwright/mcp';
import { chromium, firefox, webkit } from 'playwright';
import dotenv from 'dotenv';

// .env dosyasındaki ortam değişkenlerini yükle
dotenv.config();

// MCP Sunucusunu oluştur
const server = new Server({
  name: 'playwright-mcp-server',
  version: '1.0.0'
});

// Tarayıcı ve sayfa yönetimi için değişkenler
let browser = null;
let page = null;

/**
 * Araç: Tarayıcı başlat
 */
server.tool('launch_browser', {
  description: 'Tarayıcıyı başlat (Chrome, Firefox veya WebKit)',
  inputSchema: {
    type: 'object',
    properties: {
      browser_type: {
        type: 'string',
        enum: ['chromium', 'firefox', 'webkit'],
        description: 'Başlatılacak tarayıcı türü',
        default: process.env.BROWSER_TYPE || 'chromium'
      },
      headless: {
        type: 'boolean',
        default: process.env.HEADLESS ? process.env.HEADLESS === 'true' : false,
        description: 'Headless modda çalışsın mı?'
      }
    },
    required: []
  }
}, async (request) => {
  try {
    const { 
      browser_type = process.env.BROWSER_TYPE || 'chromium', 
      headless = process.env.HEADLESS ? process.env.HEADLESS === 'true' : false
    } = request.params.arguments;
    
    let playwrightBrowser;
    switch (browser_type) {
      case 'firefox':
        playwrightBrowser = firefox;
        break;
      case 'webkit':
        playwrightBrowser = webkit;
        break;
      default:
        playwrightBrowser = chromium;
    }

    browser = await playwrightBrowser.launch({ headless });
    page = await browser.newPage();
    
    // Default timeout ayarla
    const timeout = parseInt(process.env.TIMEOUT, 10) || 30000;
    page.setDefaultTimeout(timeout);

    return {
      type: 'text',
      text: `✅ ${browser_type} tarayıcı başarıyla başlatıldı (headless: ${headless}, timeout: ${timeout}ms)`
    };
  } catch (error) {
    return {
      type: 'text',
      text: `❌ Tarayıcı başlatılırken hata: ${error.message}`
    };
  }
});

/**
 * Araç: Sayfaya git
 */
server.tool('navigate', {
  description: 'Belirtilen URL\'ye git',
  inputSchema: {
    type: 'object',
    properties: {
      url: {
        type: 'string',
        description: 'Ziyaret edilecek URL'
      }
    },
    required: ['url']
  }
}, async (request) => {
  try {
    if (!page) throw new Error('Tarayıcı başlatılmamış');
    
    await page.goto(request.params.arguments.url, { waitUntil: 'domcontentloaded' });
    
    return {
      type: 'text',
      text: `✅ ${request.params.arguments.url} adresine gidildi`
    };
  } catch (error) {
    return {
      type: 'text',
      text: `❌ Sayfa yüklenirken hata: ${error.message}`
    };
  }
});

/**
 * Araç: Ekran görüntüsü al
 */
server.tool('screenshot', {
  description: 'Sayfanın ekran görüntüsünü al',
  inputSchema: {
    type: 'object',
    properties: {
      path: {
        type: 'string',
        description: 'Kaydedilecek dosya yolu'
      }
    }
  }
}, async (request) => {
  try {
    if (!page) throw new Error('Tarayıcı başlatılmamış');
    
    const filePath = request.params.arguments?.path || 'screenshot.png';
    await page.screenshot({ path: filePath, fullPage: true });
    
    return {
      type: 'text',
      text: `✅ Ekran görüntüsü kaydedildi: ${filePath}`
    };
  } catch (error) {
    return {
      type: 'text',
      text: `❌ Ekran görüntüsü alınırken hata: ${error.message}`
    };
  }
});

/**
 * Araç: Sayfada metin ara ve tıkla
 */
server.tool('click', {
  description: 'Belirtilen selektörde elementine tıkla',
  inputSchema: {
    type: 'object',
    properties: {
      selector: {
        type: 'string',
        description: 'CSS selector veya XPath'
      }
    },
    required: ['selector']
  }
}, async (request) => {
  try {
    if (!page) throw new Error('Tarayıcı başlatılmamış');
    
    await page.click(request.params.arguments.selector);
    
    return {
      type: 'text',
      text: `✅ Element tıklandı: ${request.params.arguments.selector}`
    };
  } catch (error) {
    return {
      type: 'text',
      text: `❌ Tıklama işlemi başarısız: ${error.message}`
    };
  }
});

/**
 * Araç: Metin gir
 */
server.tool('fill', {
  description: 'Belirtilen input alanına metin gir',
  inputSchema: {
    type: 'object',
    properties: {
      selector: {
        type: 'string',
        description: 'Input elemanının selektörü'
      },
      text: {
        type: 'string',
        description: 'Girilecek metin'
      }
    },
    required: ['selector', 'text']
  }
}, async (request) => {
  try {
    if (!page) throw new Error('Tarayıcı başlatılmamış');
    
    await page.fill(request.params.arguments.selector, request.params.arguments.text);
    
    return {
      type: 'text',
      text: `✅ Metin girildi: ${request.params.arguments.text}`
    };
  } catch (error) {
    return {
      type: 'text',
      text: `❌ Metin girişi başarısız: ${error.message}`
    };
  }
});

/**
 * Araç: Sayfa HTML'ini al
 */
server.tool('get_html', {
  description: 'Sayfanın HTML kodunu al',
  inputSchema: {
    type: 'object',
    properties: {}
  }
}, async (request) => {
  try {
    if (!page) throw new Error('Tarayıcı başlatılmamış');
    
    const html = await page.content();
    
    return {
      type: 'text',
      text: `✅ HTML alındı (${html.length} karakter):\n\n${html.substring(0, 500)}...`
    };
  } catch (error) {
    return {
      type: 'text',
      text: `❌ HTML alınırken hata: ${error.message}`
    };
  }
});

/**
 * Araç: Formu doldur
 */
server.tool('fill_form', {
  description: 'Birden fazla form alanını aynı anda doldur',
  inputSchema: {
    type: 'object',
    properties: {
      fields: {
        type: 'array',
        description: 'Doldurulacak form alanları',
        items: {
          type: 'object',
          properties: {
            selector: {
              type: 'string',
              description: 'Input elemanının CSS selector\'ü veya XPath\'i'
            },
            value: {
              type: 'string',
              description: 'Girilecek metin'
            }
          },
          required: ['selector', 'value']
        }
      },
      wait_time: {
        type: 'number',
        default: 500,
        description: 'Her alan arasında bekleme süresi (ms)'
      }
    },
    required: ['fields']
  }
}, async (request) => {
  try {
    if (!page) throw new Error('Tarayıcı başlatılmamış');
    
    const { fields, wait_time = 500 } = request.params.arguments;
    const results = [];
    let successCount = 0;
    let errorCount = 0;

    for (const field of fields) {
      try {
        await page.fill(field.selector, field.value);
        results.push(`✅ ${field.selector}: "${field.value}"`);
        successCount++;
        
        // Alanlar arasında kısa bekleme (daha gerçekçi görünüm için)
        if (wait_time > 0) {
          await page.waitForTimeout(wait_time);
        }
      } catch (fieldError) {
        results.push(`❌ ${field.selector}: ${fieldError.message}`);
        errorCount++;
      }
    }

    const summary = `
✅ Form doldurma tamamlandı
📊 Başarılı: ${successCount}/${fields.length}
❌ Başarısız: ${errorCount}/${fields.length}

Detaylar:
${results.join('\n')}
    `.trim();

    return {
      type: 'text',
      text: summary
    };
  } catch (error) {
    return {
      type: 'text',
      text: `❌ Form doldurulurken hata: ${error.message}`
    };
  }
});

/**
 * Araç: Select dropdown seçimi
 */
server.tool('select_option', {
  description: 'Select dropdown\'dan bir seçenek seç',
  inputSchema: {
    type: 'object',
    properties: {
      selector: {
        type: 'string',
        description: 'Select elemanının CSS selector\'ü'
      },
      value: {
        type: 'string',
        description: 'Seçilecek option value\'su'
      }
    },
    required: ['selector', 'value']
  }
}, async (request) => {
  try {
    if (!page) throw new Error('Tarayıcı başlatılmamış');
    
    const { selector, value } = request.params.arguments;
    await page.selectOption(selector, value);
    
    return {
      type: 'text',
      text: `✅ Select seçeneği seçildi: ${selector} = ${value}`
    };
  } catch (error) {
    return {
      type: 'text',
      text: `❌ Select seçimi başarısız: ${error.message}`
    };
  }
});

/**
 * Araç: Checkbox/Radio seç
 */
server.tool('check_element', {
  description: 'Checkbox veya radio button seç',
  inputSchema: {
    type: 'object',
    properties: {
      selector: {
        type: 'string',
        description: 'Checkbox/Radio elemanının CSS selector\'ü'
      },
      checked: {
        type: 'boolean',
        default: true,
        description: 'Seçili mi (true) yoksa seçili değil mi (false)?'
      }
    },
    required: ['selector']
  }
}, async (request) => {
  try {
    if (!page) throw new Error('Tarayıcı başlatılmamış');
    
    const { selector, checked = true } = request.params.arguments;
    
    if (checked) {
      await page.check(selector);
      return {
        type: 'text',
        text: `✅ Checkbox/Radio seçildi: ${selector}`
      };
    } else {
      await page.uncheck(selector);
      return {
        type: 'text',
        text: `✅ Checkbox/Radio seçimi kaldırıldı: ${selector}`
      };
    }
  } catch (error) {
    return {
      type: 'text',
      text: `❌ Checkbox/Radio işlemi başarısız: ${error.message}`
    };
  }
});

/**
 * Araç: Tarayıcı kapat
 */
server.tool('close_browser', {
  description: 'Tarayıcıyı kapat',
  inputSchema: {
    type: 'object',
    properties: {}
  }
}, async (request) => {
  try {
    if (browser) {
      await browser.close();
      browser = null;
      page = null;
    }
    
    return {
      type: 'text',
      text: '✅ Tarayıcı kapatıldı'
    };
  } catch (error) {
    return {
      type: 'text',
      text: `❌ Tarayıcı kapatılırken hata: ${error.message}`
    };
  }
});

// Sunucuyu başlat
server.connect(process.stdio);

console.log('🚀 Playwright MCP Sunucusu çalışıyor...');

