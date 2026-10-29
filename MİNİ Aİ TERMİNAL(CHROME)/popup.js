document.addEventListener('DOMContentLoaded', async () => {
  const output = document.getElementById('terminal-output');
  const input = document.getElementById('cmd-input');

  let currentDomain = "";
  let currentIp = "";

  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab && tab.url) {
      const urlObj = new URL(tab.url);
      currentDomain = urlObj.hostname;
      printLine(`[*] Hedef: ${currentDomain}`, "#38bdf8");
    }
  } catch (e) {
    printLine("[-] Sekme bilgisi alınamadı.", "red");
  }

  function printLine(text, color = "#e2e8f0") {
    const div = document.createElement('div');
    div.className = 'line';
    div.style.color = color;
    div.textContent = text;
    output.appendChild(div);
    output.scrollTop = output.scrollHeight;
  }

  // Komut dinleyicisi
  input.addEventListener('keydown', async (e) => {
    if (e.key === 'Enter') {
      const cmd = input.value.trim().toLowerCase();
      printLine(`> ${cmd}`, "#22c55e");
      input.value = "";

      if (cmd === 'help') {
        printLine("Mevcut Komutlar:", "#facc15");
        printLine("  ip      - Sunucu IP ve konumunu gösterir");
        printLine("  links   - Sayfadaki bağlantıları listeler");
        printLine("  clear   - Terminal ekranını temizler");
      } 
      else if (cmd === 'clear') {
        output.innerHTML = "";
      }
      else if (cmd === 'ip') {
        if (!currentDomain) { printLine("[-] Geçerli domain yok.", "red"); return; }
        printLine("[*] DNS sorgulanıyor...", "#94a3b8");
        try {
          const res = await fetch(`https://dns.google/resolve?name=${currentDomain}&type=A`);
          const data = await res.json();
          if (data.Answer) {
            currentIp = data.Answer[0].data;
            printLine(`[+] IP Adresi: ${currentIp}`, "#22c55e");
            
            // Konum
            const geoRes = await fetch(`http://ip-api.com/json/${currentIp}`);
            const geoData = await geoRes.json();
            if (geoData.status === 'success') {
              printLine(`[+] Konum: ${geoData.country} / ${geoData.city}`, "#38bdf8");
            }
          } else {
            printLine("[-] IP çözümlenemedi.", "red");
          }
        } catch (err) {
          printLine(`[-] Hata: ${err.message}`, "red");
        }
      } 
      else if (cmd === 'links') {
        printLine("[*] Sayfadaki linkler taranıyor...", "#94a3b8");
        try {
          const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
          const results = await chrome.scripting.executeScript({
            target: { tabId: tab.id },
            func: () => Array.from(document.querySelectorAll('a')).map(a => a.href).slice(0, 5)
          });
          
          if (results && results[0] && results[0].result) {
            results[0].result.forEach(link => printLine(`  -> ${link}`, "#38bdf8"));
          } else {
            printLine("[-] Link bulunamadı.", "yellow");
          }
        } catch (err) {
          printLine(`[-] Yetki hatası: ${err.message}`, "red");
        }
      } 
      else {
        printLine(`[-] Bilinmeyen komut: '${cmd}'. 'help' yazarak komutları görebilirsin.`, "red");
      }
    }
  });
});