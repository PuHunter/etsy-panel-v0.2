# NOTLAR (yeni sohbette bunu yapıştır, kaldığımız yerden devam edelim)
Proje: Etsy muhasebe paneli, Electron masaüstü uygulaması (Windows .exe + Mac .dmg), GitHub Actions ile derleniyor (depo: etsy-panel).
Kararlar: Etsy API'de mesaj endpoint'i yok. Otomatik mesaj = mağaza sale_message (updateShop). Bot/otomasyon yok. Sunucu/webhook sonra (satıştan sonra bütçe). Vergi sabit %20 (ayarlardan değişir). Veriler localStorage'da (uygulama içinde kalıcı).
Yapıldı (v0.2, hâlâ ÖRNEK VERİ): Özet (detaylı kalem tablosu, aylık tablo, ürün kârlılığı), Siparişler (durum, takip no, gecikme uyarısı, kesinti detayı), Ürünler (maliyet, başa baş fiyat), Giderler, Hazır cevaplar (8 şablon), CSV dışa aktarma, sipariş günü kuruyla TL.
Sıradaki: 1) Etsy OAuth (PKCE, http://localhost:3003/callback) + receipts/transactions çekme 2) ledger-entries ile gerçek kesintiler 3) gerçek günlük USD/TRY kuru 4) sale_message ekranı (updateShop) 5) yeni sipariş bildirimi (yoklama) 6) takip no'yu Etsy'ye gönderme 7) yorumlar sekmesi 8) ürün görüntülenme verisi API'de var mı kontrol et.
Dosyalar: main.js, index.html, style.css, app.js (ekranlar), calc.js (hesap), sample-data.js (örnek veri).
