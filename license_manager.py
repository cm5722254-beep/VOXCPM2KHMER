#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
====================================================================
🔑 VoxCPM2 License Key Generator & Manager PRO (Admin Standalone)
Complete Tool for generating, managing, and exporting License Keys &
Customer Receipts for AI Voice Clone & Dubbing Studio.
====================================================================
"""

import os
import sys
import argparse
from datetime import datetime

try:
    if hasattr(sys.stdout, 'reconfigure'):
        sys.stdout.reconfigure(encoding='utf-8', errors='replace')
    if hasattr(sys.stderr, 'reconfigure'):
        sys.stderr.reconfigure(encoding='utf-8', errors='replace')
except Exception:
    pass

# Setup project path so services can be loaded
if getattr(sys, 'frozen', False):
    BASE_DIR = os.path.dirname(sys.executable)
else:
    BASE_DIR = os.path.dirname(os.path.abspath(__file__))

if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)

from services import auth_db

def cli_generate_keys(days: int, count: int = 1, feature: str = 'voxcpm2'):
    """Generate license keys via CLI."""
    created = []
    for _ in range(count):
        k = auth_db.create_license_key(days_valid=days, feature=feature)
        created.append(k)
    return created

def cli_list_keys(only_available: bool = False):
    """List license keys via CLI."""
    keys = auth_db.list_license_keys()
    if only_available:
        keys = [k for k in keys if not k.get('is_used')]
    return keys

def format_customer_message(key_code: str, plan_name: str, created_at: str = None) -> str:
    """Generate a clean, professional Khmer message ready to send to clients via Telegram/Facebook."""
    date_str = created_at or datetime.now().strftime("%Y-%m-%d %H:%M")
    msg = (
        "═══════════════════════════════════════════════════\n"
        "🎉 ព័ត៌មានអាជ្ញាប័ណ្ណ KHMER DUBBING PRO 2026\n"
        "═══════════════════════════════════════════════════\n"
        f"🔑 លេខកូដ License Key : {key_code}\n"
        f"📦 ប្រភេទកញ្ចប់ (Plan) : {plan_name}\n"
        "💻 សិទ្ធិប្រើប្រាស់     : គាំទ្រ 1 PC (Lock តាម Machine ID)\n"
        f"📅 កាលបរិច្ឆេទបង្កើត   : {date_str}\n"
        "───────────────────────────────────────────────────\n"
        "👉 របៀបប្រើប្រាស់នៅលើកុំព្យូទ័រ៖\n"
        "1. បើកកម្មវិធី Khmer Dubbing Pro នៅលើកុំព្យូទ័ររបស់អ្នក\n"
        f"2. ចម្លងលេខកូដ Key: {key_code}\n"
        "3. Paste ចូលផ្ទាំងចាក់សោសុវត្ថិភាព រួចចុច \"ដំណើរការ Key ដោះសោរ Tool\"\n"
        "4. ប្រព័ន្ធនឹងដោះសោរស្ទូឌីយោ និងចាប់ផ្តើមដំណើរការភ្លាមៗ!\n"
        "───────────────────────────────────────────────────\n"
        "📞 ជំនួយបច្ចេកទេស Telegram: @BongCheatz_IT\n"
        "═══════════════════════════════════════════════════"
    )
    return msg

def format_html_certificate(key_code: str, plan_name: str, created_at: str = None) -> str:
    """Generate a luxury VIP License Certificate in HTML that can be printed or saved."""
    date_str = created_at or datetime.now().strftime("%Y-%m-%d %H:%M")
    return f"""<!DOCTYPE html>
<html lang="km">
<head>
  <meta charset="UTF-8">
  <title>Khmer Dubbing Pro - Official VIP License Voucher</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Kantumruy+Pro:wght@400;600;700;800&display=swap');
    body {{
      background: #07090e;
      color: #f1f5f9;
      font-family: 'Kantumruy Pro', -apple-system, BlinkMacSystemFont, sans-serif;
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      margin: 0;
      padding: 20px;
    }}
    .voucher-card {{
      background: linear-gradient(145deg, #0e1526, #07090e);
      border: 1px solid rgba(0, 194, 255, 0.4);
      box-shadow: 0 0 50px rgba(0, 194, 255, 0.2), inset 0 0 20px rgba(0, 194, 255, 0.05);
      border-radius: 28px;
      max-width: 580px;
      width: 100%;
      padding: 40px;
      box-sizing: border-box;
      position: relative;
      overflow: hidden;
    }}
    .voucher-card::before {{
      content: '';
      position: absolute;
      top: -50px;
      right: -50px;
      width: 150px;
      height: 150px;
      background: radial-gradient(circle, rgba(0,194,255,0.25) 0%, transparent 70%);
      border-radius: 50%;
    }}
    .header {{
      text-align: center;
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
      padding-bottom: 24px;
      margin-bottom: 24px;
    }}
    .badge {{
      display: inline-block;
      padding: 6px 16px;
      background: rgba(0, 194, 255, 0.15);
      border: 1px solid rgba(0, 194, 255, 0.4);
      color: #00C2FF;
      border-radius: 20px;
      font-size: 13px;
      font-weight: 700;
      letter-spacing: 1px;
      margin-bottom: 12px;
    }}
    h1 {{
      margin: 0;
      font-size: 22px;
      color: #ffffff;
      font-weight: 800;
    }}
    .sub {{
      color: #94a3b8;
      font-size: 13px;
      margin-top: 6px;
    }}
    .key-box {{
      background: #04060a;
      border: 2px dashed #00C2FF;
      border-radius: 18px;
      padding: 20px;
      text-align: center;
      margin: 24px 0;
      box-shadow: 0 0 25px rgba(0, 194, 255, 0.15);
    }}
    .key-label {{
      font-size: 11px;
      color: #94a3b8;
      text-transform: uppercase;
      letter-spacing: 1.5px;
      font-weight: 700;
    }}
    .key-code {{
      font-family: 'Consolas', monospace;
      font-size: 24px;
      font-weight: 800;
      color: #38bdf8;
      letter-spacing: 2px;
      margin-top: 8px;
    }}
    .details-grid {{
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
      background: rgba(255, 255, 255, 0.03);
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 16px;
      padding: 18px;
      margin-bottom: 24px;
      font-size: 13px;
    }}
    .detail-item .label {{
      color: #94a3b8;
      font-size: 11px;
      margin-bottom: 4px;
    }}
    .detail-item .value {{
      color: #f8fafc;
      font-weight: 700;
    }}
    .steps {{
      background: rgba(0, 194, 255, 0.05);
      border: 1px solid rgba(0, 194, 255, 0.2);
      border-radius: 16px;
      padding: 16px 20px;
      font-size: 12px;
      color: #cbd5e1;
      line-height: 1.8;
      margin-bottom: 24px;
    }}
    .steps strong {{
      color: #38bdf8;
    }}
    .footer {{
      text-align: center;
      border-top: 1px solid rgba(255, 255, 255, 0.08);
      padding-top: 18px;
      font-size: 12px;
      color: #64748b;
    }}
    .footer a {{
      color: #38bdf8;
      text-decoration: none;
      font-weight: 700;
    }}
  </style>
</head>
<body>
  <div class="voucher-card">
    <div class="header">
      <div class="badge">OFFICIAL VIP LICENSE</div>
      <h1>ប័ណ្ណអាជ្ញាប័ណ្ណ KHMER DUBBING PRO</h1>
      <div class="sub">AI Voice Clone & Multitrack Dubbing Studio</div>
    </div>

    <div class="key-box">
      <div class="key-label">លេខកូដអាជ្ញាប័ណ្ណ (License Key)</div>
      <div class="key-code">{key_code}</div>
    </div>

    <div class="details-grid">
      <div class="detail-item">
        <div class="label">ប្រភេទកញ្ចប់ (PLAN)</div>
        <div class="value">{plan_name}</div>
      </div>
      <div class="detail-item">
        <div class="label">កាលបរិច្ឆេទបង្កើត</div>
        <div class="value">{date_str}</div>
      </div>
      <div class="detail-item">
        <div class="label">សិទ្ធិប្រើប្រាស់ (DEVICES)</div>
        <div class="value">1 PC (Machine ID Locked)</div>
      </div>
      <div class="detail-item">
        <div class="label">ស្ថានភាព (STATUS)</div>
        <div class="value" style="color: #4ade80;">សកម្ម (Ready to Activate)</div>
      </div>
    </div>

    <div class="steps">
      <strong>👉 របៀបដំណើរការ៖</strong><br>
      1. បើកកម្មវិធី <strong>Khmer Dubbing Pro</strong> នៅលើកុំព្យូទ័ររបស់អ្នក<br>
      2. ចម្លងលេខកូដ Key ខាងលើ Paste ចូលប្រអប់ចាក់សោសុវត្ថិភាព<br>
      3. ចុច <strong>"ដំណើរការ Key ដោះសោរ Tool"</strong> ជាការស្រេច!
    </div>

    <div class="footer">
      ត្រូវការជំនួយបច្ចេកទេស? Telegram: <a href="https://t.me/BongCheatz_IT">@BongCheatz_IT</a>
    </div>
  </div>
</body>
</html>
"""

# ====================================================================
# Modern GUI Application (Tkinter Pro)
# ====================================================================
def run_gui():
    import tkinter as tk
    from tkinter import ttk, messagebox, filedialog

    root = tk.Tk()
    root.title("🔑 Khmer Dubbing Pro — License Key Manager & Generator PRO")
    root.geometry("920x760")
    root.minsize(860, 680)
    root.configure(bg="#080c14")

    # Set icon if available
    try:
        ico_path = os.path.join(BASE_DIR, 'public', 'favicon.ico')
        if os.path.exists(ico_path):
            root.iconbitmap(ico_path)
    except Exception:
        pass

    # Configure styles
    style = ttk.Style()
    style.theme_use('clam')
    style.configure(
        "Treeview", 
        background="#0f172a", 
        foreground="#f8fafc", 
        fieldbackground="#0f172a",
        rowheight=30,
        font=("Segoe UI", 9)
    )
    style.configure(
        "Treeview.Heading", 
        background="#1e293b", 
        foreground="#38bdf8", 
        font=("Segoe UI", 9, "bold"),
        relief="flat"
    )
    style.map("Treeview", background=[('selected', '#0284c7')], foreground=[('selected', '#ffffff')])

    # ── Top Modern Header Bar ──
    header_frame = tk.Frame(root, bg="#0d1424", padx=20, pady=14, highlightbackground="#1e293b", highlightthickness=1)
    header_frame.pack(fill="x", padx=16, pady=(16, 8))

    header_top = tk.Frame(header_frame, bg="#0d1424")
    header_top.pack(fill="x")

    title_label = tk.Label(
        header_top, 
        text="🔑 KHMER DUBBING PRO — LICENSE MANAGER", 
        font=("Segoe UI", 14, "bold"), 
        fg="#00C2FF", 
        bg="#0d1424"
    )
    title_label.pack(side="left")

    admin_badge = tk.Label(
        header_top, 
        text="ADMIN EDITION 2026", 
        font=("Segoe UI", 8, "bold"), 
        fg="#38bdf8", 
        bg="#032541", 
        padx=8, 
        pady=2
    )
    admin_badge.pack(side="right")

    subtitle_label = tk.Label(
        header_frame, 
        text="ឧបករណ៍គ្រប់គ្រង បង្កើត និង Export ប័ណ្ណអាជ្ញាប័ណ្ណ License សម្រាប់ផ្ញើជូនអតិថិជន (Telegram / Receipt Voucher)", 
        font=("Segoe UI", 9), 
        fg="#94a3b8", 
        bg="#0d1424"
    )
    subtitle_label.pack(anchor="w", pady=(4, 0))

    # ── Section 1: Generate Key Card ──
    gen_frame = tk.LabelFrame(
        root, 
        text=" ✨ បង្កើត License Key ថ្មី (Generate New Keys) ", 
        font=("Segoe UI", 10, "bold"),
        fg="#38bdf8", 
        bg="#0d1527", 
        padx=16, 
        pady=12, 
        highlightbackground="#1e293b", 
        highlightthickness=1
    )
    gen_frame.pack(fill="x", padx=16, pady=6)

    controls_row = tk.Frame(gen_frame, bg="#0d1527")
    controls_row.pack(fill="x")

    tk.Label(controls_row, text="ប្រភេទកញ្ចប់:", font=("Segoe UI", 9, "bold"), fg="#e2e8f0", bg="#0d1527").pack(side="left", padx=(0, 6))

    plan_options = [
        ("⏱️ សាកល្បង ៧ ថ្ងៃ (Trial 7 Days)", 7),
        ("📅 ១ ខែ (30 ថ្ងៃ - Monthly)", 30),
        ("🗓️ ១ ឆ្នាំ (365 ថ្ងៃ - Yearly)", 365),
        ("👑 ពេញមួយជីវិត (Lifetime VIP)", -1),
    ]

    plan_combo = ttk.Combobox(controls_row, state="readonly", width=32, font=("Segoe UI", 9))
    plan_combo['values'] = [item[0] for item in plan_options]
    plan_combo.current(1)  # Default: 30 days
    plan_combo.pack(side="left", padx=(0, 16))

    tk.Label(controls_row, text="ចំនួន:", font=("Segoe UI", 9, "bold"), fg="#e2e8f0", bg="#0d1527").pack(side="left", padx=(0, 6))
    count_var = tk.IntVar(value=1)
    count_spin = tk.Spinbox(controls_row, from_=1, to=100, textvariable=count_var, width=4, font=("Segoe UI", 9, "bold"), bg="#1e293b", fg="#ffffff", buttonbackground="#334155")
    count_spin.pack(side="left", padx=(0, 16))

    # Output text for latest generated key
    new_keys_frame = tk.Frame(gen_frame, bg="#0d1527")
    new_keys_frame.pack(fill="x", pady=(10, 0))

    new_keys_entry = tk.Entry(
        new_keys_frame, 
        font=("Consolas", 12, "bold"), 
        bg="#050811", 
        fg="#00e676", 
        relief="flat", 
        highlightbackground="#00C2FF", 
        highlightthickness=1
    )
    new_keys_entry.pack(side="left", fill="x", expand=True, padx=(0, 8), ipady=6)

    def get_selected_plan_info():
        idx = plan_combo.current()
        if 0 <= idx < len(plan_options):
            label, days = plan_options[idx]
            clean_name = label.split('(')[0].strip()
            return days, clean_name
        return 30, "១ ខែ (30 ថ្ងៃ)"

    def copy_text_to_clipboard(txt: str, msg: str = "បានចម្លង Key ទៅ Clipboard រួចរាល់!"):
        root.clipboard_clear()
        root.clipboard_append(txt)
        root.update()
        messagebox.showinfo("ជោគជ័យ", msg)

    def on_generate():
        days, plan_label = get_selected_plan_info()
        count = count_var.get()
        if count < 1:
            count = 1
        
        try:
            created = cli_generate_keys(days, count)
            key_codes = [k['key_code'] for k in created]
            display_str = " , ".join(key_codes)
            
            new_keys_entry.delete(0, tk.END)
            new_keys_entry.insert(0, display_str)
            
            # Update customer preview
            latest_key = key_codes[0]
            customer_msg = format_customer_message(latest_key, plan_label)
            client_preview_text.delete("1.0", tk.END)
            client_preview_text.insert("1.0", customer_msg)

            # Refresh Table
            refresh_table()

            if len(key_codes) == 1:
                copy_text_to_clipboard(customer_msg, f"🎉 បានបង្កើត Key ជោគជ័យ!\n\nKey: {latest_key}\n\n(បានចម្លងសារសម្រាប់ផ្ញើជូនភ្ញៀវទៅ Clipboard រួចជាស្រេច!)")
            else:
                copy_text_to_clipboard("\n".join(key_codes), f"🎉 បានបង្កើតចំនួន {len(key_codes)} Keys ជោគជ័យ!\n\n(បានចម្លង Key ទាំងអស់ទៅ Clipboard រួចរាល់)")
        except Exception as ex:
            messagebox.showerror("បញ្ហា", f"មិនអាចបង្កើត Key បានទេ: {ex}")

    gen_btn = tk.Button(
        controls_row, 
        text="🚀 បង្កើត Key ឥឡូវនេះ", 
        font=("Segoe UI", 9, "bold"), 
        bg="#0284c7", 
        fg="#ffffff", 
        activebackground="#0369a1", 
        activeforeground="#ffffff", 
        relief="flat", 
        padx=14, 
        pady=4, 
        cursor="hand2",
        command=on_generate
    )
    gen_btn.pack(side="left")

    copy_btn = tk.Button(
        new_keys_frame, 
        text="📋 ចម្លង Key", 
        font=("Segoe UI", 9, "bold"), 
        bg="#10b981", 
        fg="#ffffff", 
        relief="flat", 
        padx=12, 
        pady=5, 
        cursor="hand2",
        command=lambda: copy_text_to_clipboard(new_keys_entry.get().strip()) if new_keys_entry.get().strip() else None
    )
    copy_btn.pack(side="right")

    # ── Section 2: Customer Voucher / Export Preview Panel ──
    export_box = tk.LabelFrame(
        root, 
        text=" 🧾 ផ្ញើជូនភ្ញៀវ & Export (Customer Receipt / Voucher) ", 
        font=("Segoe UI", 10, "bold"),
        fg="#38bdf8", 
        bg="#0d1527", 
        padx=16, 
        pady=10, 
        highlightbackground="#1e293b", 
        highlightthickness=1
    )
    export_box.pack(fill="x", padx=16, pady=4)

    client_preview_frame = tk.Frame(export_box, bg="#0d1527")
    client_preview_frame.pack(fill="x")

    client_preview_text = tk.Text(
        client_preview_frame, 
        height=6, 
        font=("Consolas", 9), 
        bg="#050811", 
        fg="#e2e8f0", 
        relief="flat", 
        highlightbackground="#334155", 
        highlightthickness=1,
        padx=8,
        pady=6
    )
    client_preview_text.pack(side="left", fill="x", expand=True, padx=(0, 10))
    client_preview_text.insert("1.0", "ជ្រើសរើស Key មួយពីតារាងខាងក្រោម ឬចុចបង្កើត Key ថ្មី ដើម្បីមើលសារដែលត្រូវផ្ញើជូនភ្ញៀវ...")

    export_actions_frame = tk.Frame(client_preview_frame, bg="#0d1527")
    export_actions_frame.pack(side="right", fill="y")

    def on_copy_customer_message():
        txt = client_preview_text.get("1.0", tk.END).strip()
        if not txt or txt.startswith("ជ្រើសរើស Key"):
            messagebox.showwarning("ជូនដំណឹង", "សូមជ្រើសរើស Key មួយពីតារាងជាមុនសិន!")
            return
        copy_text_to_clipboard(txt, "📋 បានចម្លងសារព័ត៌មាន License សម្រាប់ផ្ញើទៅភ្ញៀវរួចរាល់!")

    def on_export_txt_voucher():
        txt = client_preview_text.get("1.0", tk.END).strip()
        if not txt or txt.startswith("ជ្រើសរើស Key"):
            messagebox.showwarning("ជូនដំណឹង", "សូមជ្រើសរើស Key មួយពីតារាងជាមុនសិន!")
            return
        
        file_path = filedialog.asksaveasfilename(
            defaultextension=".txt", 
            filetypes=[("Text files", "*.txt")],
            initialfile=f"KhmerDubbingPro_License_Voucher_{datetime.now().strftime('%Y%m%d_%H%M')}.txt"
        )
        if file_path:
            with open(file_path, "w", encoding="utf-8") as f:
                f.write(txt)
            messagebox.showinfo("ជោគជ័យ", f"បាន Export ប័ណ្ណអតិថិជនរួចរាល់ទៅកាន់:\n{file_path}")

    def on_export_html_certificate():
        selected = tree.selection()
        key_code = ""
        plan_name = "VIP License"
        if selected:
            item = tree.item(selected[0])
            key_code = item['values'][1]
            plan_name = item['values'][2]
        else:
            txt = new_keys_entry.get().strip()
            if txt:
                key_code = txt.split(',')[0].strip()
                _, plan_name = get_selected_plan_info()

        if not key_code:
            messagebox.showwarning("ជូនដំណឹង", "សូមជ្រើសរើស Key មួយពីតារាងដើម្បី Export ប័ណ្ណ VIP Certificate!")
            return

        html_content = format_html_certificate(key_code, plan_name)
        file_path = filedialog.asksaveasfilename(
            defaultextension=".html", 
            filetypes=[("HTML files", "*.html")],
            initialfile=f"KhmerDubbingPro_VIP_License_{key_code}.html"
        )
        if file_path:
            with open(file_path, "w", encoding="utf-8") as f:
                f.write(html_content)
            messagebox.showinfo("ជោគជ័យ", f"បាន Export ប័ណ្ណ VIP Certificate (.html) រួចរាល់!\n\nអ្នកអាចបើកមើល ឬផ្ញើ File នេះទៅកាន់ភ្ញៀវ:\n{file_path}")

    btn_copy_cust = tk.Button(
        export_actions_frame, 
        text="📋 ចម្លងសារផ្ញើភ្ញៀវ", 
        font=("Segoe UI", 9, "bold"), 
        bg="#0284c7", 
        fg="#ffffff", 
        relief="flat", 
        padx=12, 
        pady=4, 
        cursor="hand2",
        command=on_copy_customer_message
    )
    btn_copy_cust.pack(fill="x", pady=2)

    btn_export_voucher = tk.Button(
        export_actions_frame, 
        text="🧾 Export ប័ណ្ណ (.txt)", 
        font=("Segoe UI", 9, "bold"), 
        bg="#1e293b", 
        fg="#38bdf8", 
        relief="flat", 
        padx=12, 
        pady=4, 
        cursor="hand2",
        command=on_export_txt_voucher
    )
    btn_export_voucher.pack(fill="x", pady=2)

    btn_export_html = tk.Button(
        export_actions_frame, 
        text="🎨 Export ប័ណ្ណ VIP (.html)", 
        font=("Segoe UI", 9, "bold"), 
        bg="#1e293b", 
        fg="#f59e0b", 
        relief="flat", 
        padx=12, 
        pady=4, 
        cursor="hand2",
        command=on_export_html_certificate
    )
    btn_export_html.pack(fill="x", pady=2)

    # ── Section 3: Database Table (All Keys) ──
    list_frame = tk.LabelFrame(
        root, 
        text=" 📋 បញ្ជី Key License ទាំងអស់ក្នុងប្រព័ន្ធ (Database Inventory) ", 
        font=("Segoe UI", 10, "bold"),
        fg="#38bdf8", 
        bg="#0d1527", 
        padx=12, 
        pady=8, 
        highlightbackground="#1e293b", 
        highlightthickness=1
    )
    list_frame.pack(fill="both", expand=True, padx=16, pady=6)

    # Filter & Search bar
    filter_bar = tk.Frame(list_frame, bg="#0d1527")
    filter_bar.pack(fill="x", pady=(0, 6))

    filter_var = tk.StringVar(value="all")

    def on_filter_change():
        refresh_table()

    tk.Radiobutton(filter_bar, text="ទាំងអស់ (All)", variable=filter_var, value="all", command=on_filter_change, bg="#0d1527", fg="#e2e8f0", selectcolor="#080c14", font=("Segoe UI", 9)).pack(side="left", padx=4)
    tk.Radiobutton(filter_bar, text="🟢 មិនទាន់ប្រើ (Available)", variable=filter_var, value="available", command=on_filter_change, bg="#0d1527", fg="#4ade80", selectcolor="#080c14", font=("Segoe UI", 9)).pack(side="left", padx=4)
    tk.Radiobutton(filter_bar, text="🔴 បានប្រើរួច (Used)", variable=filter_var, value="used", command=on_filter_change, bg="#0d1527", fg="#f87171", selectcolor="#080c14", font=("Segoe UI", 9)).pack(side="left", padx=4)

    # Search bar
    search_var = tk.StringVar()
    tk.Label(filter_bar, text="🔍 ស្វែងរក:", font=("Segoe UI", 9), fg="#94a3b8", bg="#0d1527").pack(side="left", padx=(16, 4))
    search_entry = tk.Entry(filter_bar, textvariable=search_var, font=("Segoe UI", 9), bg="#1e293b", fg="#ffffff", relief="flat", width=18)
    search_entry.pack(side="left")
    search_entry.bind("<KeyRelease>", lambda e: refresh_table())

    # Stats label
    stats_label = tk.Label(filter_bar, text="", font=("Segoe UI", 9, "bold"), fg="#38bdf8", bg="#0d1527")
    stats_label.pack(side="right", padx=6)

    # Treeview
    columns = ("id", "key_code", "duration", "status", "used_by", "created_at")
    tree = ttk.Treeview(list_frame, columns=columns, show="headings", selectmode="browse")
    
    tree.heading("id", text="#")
    tree.heading("key_code", text="លេខកូដ Key License")
    tree.heading("duration", text="សុពលភាព / Plan")
    tree.heading("status", text="ស្ថានភាព")
    tree.heading("used_by", text="ដំណើរការដោយអ្នកប្រើ")
    tree.heading("created_at", text="កាលបរិច្ឆេទបង្កើត")

    tree.column("id", width=45, anchor="center")
    tree.column("key_code", width=220, anchor="w")
    tree.column("duration", width=140, anchor="center")
    tree.column("status", width=110, anchor="center")
    tree.column("used_by", width=180, anchor="w")
    tree.column("created_at", width=140, anchor="center")

    scrollbar = ttk.Scrollbar(list_frame, orient="vertical", command=tree.yview)
    tree.configure(yscrollcommand=scrollbar.set)
    scrollbar.pack(side="right", fill="y")
    tree.pack(side="left", fill="both", expand=True)

    def refresh_table():
        for row in tree.get_children():
            tree.delete(row)
        
        filter_mode = filter_var.get()
        search_query = search_var.get().strip().upper()
        keys = auth_db.list_license_keys()
        
        total_count = len(keys)
        avail_count = sum(1 for k in keys if not k.get('is_used'))
        used_count = total_count - avail_count
        stats_label.config(text=f"សរុប៖ {total_count} | 🟢 ទំនេរ៖ {avail_count} | 🔴 ប្រើរួច៖ {used_count}")

        for k in keys:
            is_used = bool(k.get('is_used'))
            if filter_mode == "available" and is_used:
                continue
            if filter_mode == "used" and not is_used:
                continue
            
            key_code = str(k.get('key_code', ''))
            used_user = k.get('used_by_username') or ('—' if not is_used else f"User #{k.get('used_by_user_id')}")

            if search_query and (search_query not in key_code.upper() and search_query not in str(used_user).upper()):
                continue

            days = k.get('days_valid', 30)
            if days == -1:
                dur_str = "👑 Lifetime VIP"
            elif days == 7:
                dur_str = "⏱️ Trial 7 ថ្ងៃ"
            elif days == 30:
                dur_str = "📅 1 ខែ (30 ថ្ងៃ)"
            elif days == 365:
                dur_str = "🗓️ 1 ឆ្នាំ (365 ថ្ងៃ)"
            else:
                dur_str = f"{days} ថ្ងៃ"

            status_str = "🔴 បានប្រើរួច" if is_used else "🟢 នៅទំនេរ"
            
            created_raw = k.get('created_at', '')
            try:
                created_dt = datetime.fromisoformat(created_raw)
                created_str = created_dt.strftime("%Y-%m-%d %H:%M")
            except Exception:
                created_str = created_raw[:16]

            tree.insert("", "end", values=(k.get('id'), key_code, dur_str, status_str, used_user, created_str))

    def on_tree_select(event):
        selected = tree.selection()
        if selected:
            item = tree.item(selected[0])
            key_code = item['values'][1]
            plan_str = item['values'][2]
            created_str = item['values'][5]

            # Populate preview box
            msg = format_customer_message(key_code, plan_str, created_str)
            client_preview_text.delete("1.0", tk.END)
            client_preview_text.insert("1.0", msg)

    tree.bind("<<TreeviewSelect>>", on_tree_select)

    # ── Section 4: Bottom Actions Toolbar ──
    bottom_bar = tk.Frame(root, bg="#080c14")
    bottom_bar.pack(fill="x", padx=16, pady=(4, 16))

    def on_copy_selected_key():
        selected = tree.selection()
        if not selected:
            messagebox.showwarning("ជូនដំណឹង", "សូមចុចជ្រើសរើស Key មួយពីតារាងជាមុនសិន!")
            return
        item = tree.item(selected[0])
        key_code = item['values'][1]
        copy_text_to_clipboard(str(key_code), f"បានចម្លង Key: {key_code}")

    def on_delete_selected():
        selected = tree.selection()
        if not selected:
            messagebox.showwarning("ជូនដំណឹង", "សូមចុចជ្រើសរើស Key មួយពីតារាងជាមុនសិន!")
            return
        item = tree.item(selected[0])
        key_id = item['values'][0]
        key_code = item['values'][1]

        confirm = messagebox.askyesno("បញ្ជាក់ការលុប", f"តើអ្នកពិតជាចង់លុប Key License នេះមែនទេ?\n\n{key_code}")
        if confirm:
            try:
                auth_db.delete_license_key(int(key_id))
                refresh_table()
                messagebox.showinfo("ជោគជ័យ", "បានលុប Key License រួចរាល់!")
            except Exception as e:
                messagebox.showerror("បញ្ហា", f"មិនអាចលុប Key បានទេ: {e}")

    def on_export_all_csv():
        keys = auth_db.list_license_keys()
        if not keys:
            messagebox.showinfo("ជូនដំណឹង", "មិនមានទិន្នន័យ Key សម្រាប់ Export ទេ!")
            return
        
        file_path = filedialog.asksaveasfilename(
            defaultextension=".csv", 
            filetypes=[("CSV files", "*.csv"), ("Text files", "*.txt")],
            initialfile=f"KhmerDubbingPro_All_License_Keys_{datetime.now().strftime('%Y%m%d')}.csv"
        )
        if file_path:
            with open(file_path, "w", encoding="utf-8-sig") as f:
                f.write("ID,Key_Code,Days_Valid,Is_Used,Used_By,Created_At\n")
                for k in keys:
                    f.write(f"{k.get('id')},{k.get('key_code')},{k.get('days_valid')},{1 if k.get('is_used') else 0},{k.get('used_by_username') or ''},{k.get('created_at') or ''}\n")
            messagebox.showinfo("ជោគជ័យ", f"បាន Export ចំនួន {len(keys)} Keys ទៅកាន់ CSV រួចរាល់:\n{file_path}")

    btn_copy_key = tk.Button(
        bottom_bar, 
        text="📋 ចម្លងតែលេខកូដ Key", 
        font=("Segoe UI", 9, "bold"), 
        bg="#1e293b", 
        fg="#e2e8f0", 
        relief="flat", 
        padx=12, 
        pady=5, 
        cursor="hand2",
        command=on_copy_selected_key
    )
    btn_copy_key.pack(side="left", padx=(0, 8))

    btn_export_csv = tk.Button(
        bottom_bar, 
        text="📊 Export តារាង (.csv)", 
        font=("Segoe UI", 9, "bold"), 
        bg="#1e293b", 
        fg="#38bdf8", 
        relief="flat", 
        padx=12, 
        pady=5, 
        cursor="hand2",
        command=on_export_all_csv
    )
    btn_export_csv.pack(side="left", padx=(0, 8))

    btn_refresh = tk.Button(
        bottom_bar, 
        text="🔄 Refresh", 
        font=("Segoe UI", 9), 
        bg="#1e293b", 
        fg="#94a3b8", 
        relief="flat", 
        padx=12, 
        pady=5, 
        cursor="hand2",
        command=refresh_table
    )
    btn_refresh.pack(side="left")

    btn_delete = tk.Button(
        bottom_bar, 
        text="🗑️ លុប Key នេះចោល", 
        font=("Segoe UI", 9), 
        bg="#7f1d1d", 
        fg="#fecaca", 
        activebackground="#991b1b", 
        activeforeground="#ffffff", 
        relief="flat", 
        padx=12, 
        pady=5, 
        cursor="hand2",
        command=on_delete_selected
    )
    btn_delete.pack(side="right")

    # Initial table load
    refresh_table()

    root.mainloop()

# ====================================================================
# Main CLI Dispatcher
# ====================================================================
def main():
    parser = argparse.ArgumentParser(description="VoxCPM2 License Key Generator & Manager PRO")
    parser.add_argument('--generate', action='store_true', help='Generate new keys in CLI')
    parser.add_argument('--days', type=int, default=30, help='License days: 7 (Trial), 30 (1 Mo), 365 (1 Yr), -1 (Lifetime)')
    parser.add_argument('--count', type=int, default=1, help='Number of keys to generate')
    parser.add_argument('--list', action='store_true', help='List existing keys in CLI')
    parser.add_argument('--available', action='store_true', help='Only list available keys')

    args = parser.parse_args()

    if args.generate:
        keys = cli_generate_keys(args.days, args.count)
        print(f"\n🎉 Successfully generated {len(keys)} License Key(s):")
        for k in keys:
            print(f"  👉 Key: {k['key_code']} | Days: {k['days_valid']} | Plan: {k['tier_label']}")
        print()
    elif args.list:
        keys = cli_list_keys(args.available)
        print(f"\n📋 Total {len(keys)} License Key(s):")
        for k in keys:
            status = "🔴 USED" if k.get('is_used') else "🟢 AVAILABLE"
            print(f"  [{status}] {k['key_code']} | {k.get('days_valid')} days | Used by: {k.get('used_by_username') or 'N/A'}")
        print()
    else:
        # Default: Launch GUI application
        run_gui()

if __name__ == '__main__':
    main()
