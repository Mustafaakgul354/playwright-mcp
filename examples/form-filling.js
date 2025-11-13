/**
 * Form Doldurma Örneği
 * 
 * Bu örnek, çeşitli form türlerini doldurmayı gösterir.
 */

import { chromium } from 'playwright';

async function main() {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  try {
    // 1. Test formuna git (JSONPlaceholder typicode örneği)
    console.log('📍 Form sayfasına gidiliyor...');
    await page.goto('https://jsonplaceholder.typicode.com/');
    
    // 2. Örnek: Basit bir form doldur
    console.log('📝 Form doldurulmaya başlanıyor...');
    
    // Metin input'ları doldur
    const fields = [
      { selector: 'input[name="username"]', value: 'testuser123' },
      { selector: 'input[name="email"]', value: 'test@example.com' },
      { selector: 'input[name="phone"]', value: '+90 555 123 4567' },
    ];

    for (const field of fields) {
      try {
        await page.fill(field.selector, field.value);
        console.log(`✅ Dolduruldu: ${field.selector}`);
      } catch (error) {
        console.log(`⚠️ Atlandı (element bulunamadı): ${field.selector}`);
      }
    }

    // 3. Select dropdown örneği (eğer varsa)
    console.log('🔽 Dropdown seçimi yapılıyor...');
    try {
      await page.selectOption('select[name="role"]', 'admin');
      console.log('✅ Dropdown seçildi');
    } catch (error) {
      console.log('⚠️ Dropdown bulunamadı');
    }

    // 4. Checkbox örneği
    console.log('☑️ Checkbox seçiliyor...');
    try {
      await page.check('input[type="checkbox"]');
      console.log('✅ Checkbox seçildi');
    } catch (error) {
      console.log('⚠️ Checkbox bulunamadı');
    }

    // 5. Gönder butonu varsa tıkla
    console.log('🔘 Form gönderiliyor...');
    try {
      await page.click('button[type="submit"]');
      console.log('✅ Form gönderildi');
      
      // Sonuç sayfasını bekleme
      await page.waitForNavigation({ timeout: 5000 }).catch(() => {
        console.log('⏱️ Yönlendirme olmadı');
      });
    } catch (error) {
      console.log('⚠️ Submit butonu bulunamadı');
    }

    // 6. Ekran görüntüsü al
    console.log('📸 Ekran görüntüsü alınıyor...');
    await page.screenshot({ path: 'form-result.png', fullPage: true });
    console.log('✅ Ekran görüntüsü kaydedildi: form-result.png');

    console.log('\n✨ Form doldurma örneği tamamlandı!');

  } catch (error) {
    console.error('❌ Hata:', error.message);
  } finally {
    await browser.close();
  }
}

main();

