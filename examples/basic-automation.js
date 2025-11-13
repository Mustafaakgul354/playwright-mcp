/**
 * Basit Playwright MCP Kullanım Örneği
 * 
 * Bu örnek, MCP sunucusunun nasıl kullanılacağını gösterir.
 */

import { chromium as chromiumExtra } from 'playwright-extra';
import stealth from 'puppeteer-extra-plugin-stealth';
import os from 'os';
import path from 'path';

// Stealth eklentisini playwright-extra'ya ekle
chromiumExtra.use(stealth());

async function main() {
  // Tarayıcıyı stealth moduyla BAĞIMSIZ (temiz) bir profilde başlat
  const browser = await chromiumExtra.launch({ 
    headless: false,
  });
  
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.0.0 Safari/537.36'
  });
  
  const page = await context.newPage();

  try {
    // 1. Google'a git
    console.log('📍 Google\'a gidiliyor...');
    await page.goto('https://www.google.com', { waitUntil: 'networkidle' });
    
    // Rastgele bir bekleme
    await page.waitForTimeout(Math.random() * 1500 + 500);

    // Olası çerez onayı ekranını atla
    try {
      const acceptButton = page.locator('text=Accept all, text=Tümünü kabul et, button:has-text("Accept all"), button:has-text("Tümünü kabul et")');
      await acceptButton.click({ timeout: 5000 });
      console.log('🍪 Çerez onayı verildi.');
    } catch (e) {
      console.log('ℹ️ Çerez onayı ekranı bulunamadı, devam ediliyor.');
    }
    
    // 2. Arama kutusunu bul ve metin gir
    console.log('🔍 "Playwright automation" aranıyor...');
    const searchBoxSelector = 'input[name="q"], textarea[name="q"]';
    await page.waitForSelector(searchBoxSelector, { state: 'visible' });
    
    // Arama kutusuna insan gibi hareket et
    const box = await page.locator(searchBoxSelector).boundingBox();
    if (box) {
      await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2, { steps: 15 });
    }
    await page.waitForTimeout(Math.random() * 200 + 100);
    
    await page.type(searchBoxSelector, 'Playwright automation', { delay: Math.random() * 150 + 50 });
    
    // 3. Ara tuşuna basmak yerine butona tıkla
    await page.waitForTimeout(Math.random() * 1000 + 300); // küçük bir bekleme
    const searchButton = page.locator('input[type="submit"][name="btnK"], input[type="submit"][name="btnG"]').first();
    await searchButton.hover();
    await page.waitForTimeout(Math.random() * 200 + 100);
    await searchButton.click();
    
    // Sonuçların yüklenmesini bekle
    await page.waitForSelector('#result-stats', { state: 'visible' });
    
    // 4. Ekran görüntüsü al
    console.log('📸 Ekran görüntüsü alınıyor...');
    await page.screenshot({ path: 'search-results.png', fullPage: true });
    
    // 5. Sonuç linklerini al
    console.log('📋 Sonuç linkleri getiriliyor...');
    const results = await page.locator('div.g a').allTextContents();
    console.log(`✅ ${results.length} sonuç bulundu`);
    
    console.log('\n✨ Otomasyon tamamlandı!');
    
  } catch (error) {
    console.error('❌ Hata:', error.message);
  } finally {
    // Tarayıcıyı kapat
    await browser.close();
  }
}

main();

