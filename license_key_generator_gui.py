"""
🔑 DABBER PRO - License Key Generator GUI
Beautiful animated license key generator with modern UI
"""

import tkinter as tk
from tkinter import ttk, messagebox
import sys
import os
from datetime import datetime, timedelta
import random
import string
import math

# Add parent directory to path
sys.path.insert(0, os.path.dirname(__file__))
from services.license_manager import (
    create_license_key, 
    list_all_license_keys, 
    list_all_activations,
    deactivate_machine,
    init_license_db
)

class ModernButton(tk.Canvas):
    def __init__(self, parent, text, command, color="#A855F7", hover_color="#9333EA", **kwargs):
        super().__init__(parent, **kwargs)
        self.text = text
        self.command = command
        self.color = color
        self.hover_color = hover_color
        self.is_hovered = False
        
        self.config(
            highlightthickness=0,
            bg=parent.cget('bg')
        )
        
        self.draw()
        self.bind('<Enter>', self.on_enter)
        self.bind('<Leave>', self.on_leave)
        self.bind('<Button-1>', self.on_click)
        
    def draw(self):
        self.delete('all')
        w = self.winfo_reqwidth() or 200
        h = self.winfo_reqheight() or 45
        
        color = self.hover_color if self.is_hovered else self.color
        
        # Rounded rectangle
        self.create_rounded_rect(2, 2, w-2, h-2, radius=12, fill=color, outline='')
        
        # Text
        self.create_text(w//2, h//2, text=self.text, fill='white', 
                        font=('Segoe UI', 11, 'bold'))
    
    def create_rounded_rect(self, x1, y1, x2, y2, radius=25, **kwargs):
        points = [
            x1+radius, y1,
            x1+radius, y1,
            x2-radius, y1,
            x2-radius, y1,
            x2, y1,
            x2, y1+radius,
            x2, y1+radius,
            x2, y2-radius,
            x2, y2-radius,
            x2, y2,
            x2-radius, y2,
            x2-radius, y2,
            x1+radius, y2,
            x1+radius, y2,
            x1, y2,
            x1, y2-radius,
            x1, y2-radius,
            x1, y1+radius,
            x1, y1+radius,
            x1, y1
        ]
        return self.create_polygon(points, smooth=True, **kwargs)
    
    def on_enter(self, e):
        self.is_hovered = True
        self.draw()
        self.config(cursor='hand2')
    
    def on_leave(self, e):
        self.is_hovered = False
        self.draw()
        self.config(cursor='')
    
    def on_click(self, e):
        if self.command:
            self.command()


class LicenseKeyGeneratorGUI:
    def __init__(self, root):
        self.root = root
        self.root.title("🔑 DABBER PRO - License Key Generator")
        self.root.geometry("1000x700")
        self.root.resizable(True, True)
        
        # Colors
        self.bg_dark = "#0a0a0a"
        self.bg_panel = "#0f0f0f"
        self.bg_header = "#111111"
        self.purple = "#A855F7"
        self.pink = "#EC4899"
        self.text_white = "#ffffff"
        self.text_gray = "#9ca3af"
        
        self.root.configure(bg=self.bg_dark)
        
        # Animation variables
        self.particles = []
        self.animation_running = True
        
        # Initialize database
        init_license_db()
        
        self.setup_ui()
        self.animate_particles()
        self.start_gradient_animation()
        
    def setup_ui(self):
        # Animated Background Canvas
        self.bg_canvas = tk.Canvas(
            self.root,
            bg=self.bg_dark,
            highlightthickness=0
        )
        self.bg_canvas.place(x=0, y=0, relwidth=1, relheight=1)
        
        # Create floating particles
        for _ in range(30):
            x = random.randint(0, 1000)
            y = random.randint(0, 700)
            size = random.randint(2, 5)
            speed = random.uniform(0.5, 2)
            particle = self.bg_canvas.create_oval(
                x, y, x+size, y+size,
                fill=random.choice([self.purple, self.pink, "#3b82f6"]),
                outline=""
            )
            self.particles.append({
                'id': particle,
                'x': x,
                'y': y,
                'size': size,
                'speed': speed,
                'direction': random.uniform(0, 2 * math.pi)
            })
        
        # Main Frame (on top of canvas)
        main_container = tk.Frame(self.root, bg=self.bg_dark)
        main_container.place(x=0, y=0, relwidth=1, relheight=1)
        
        # Header with gradient effect
        header = tk.Frame(main_container, bg=self.bg_header, height=100)
        header.pack(fill='x', pady=(0, 20))
        header.pack_propagate(False)
        
        # Animated title
        title_frame = tk.Frame(header, bg=self.bg_header)
        title_frame.pack(pady=15)
        
        title_label = tk.Label(
            title_frame,
            text="💎 DABBER PRO",
            font=("Segoe UI", 28, "bold"),
            bg=self.bg_header,
            fg=self.text_white
        )
        title_label.pack()
        
        subtitle = tk.Label(
            title_frame,
            text="✨ License Key Generator & Manager ✨",
            font=("Segoe UI", 11),
            bg=self.bg_header,
            fg=self.text_gray
        )
        subtitle.pack()
        
        # Main Container with tabs
        main_frame = tk.Frame(main_container, bg=self.bg_dark)
        main_frame.pack(fill='both', expand=True, padx=30, pady=10)
        
        # Create notebook for tabs
        style = ttk.Style()
        style.theme_use('default')
        style.configure('TNotebook', background=self.bg_dark, borderwidth=0)
        style.configure('TNotebook.Tab', 
                       background=self.bg_panel, 
                       foreground=self.text_gray,
                       padding=[20, 10],
                       font=('Segoe UI', 10, 'bold'))
        style.map('TNotebook.Tab',
                 background=[('selected', self.purple)],
                 foreground=[('selected', self.text_white)])
        
        notebook = ttk.Notebook(main_frame)
        notebook.pack(fill='both', expand=True)
        
        # Tab 1: Generate Keys
        generate_tab = tk.Frame(notebook, bg=self.bg_dark)
        notebook.add(generate_tab, text='⚡ Generate Key')
        
        # Tab 2: Manage Keys
        manage_tab = tk.Frame(notebook, bg=self.bg_dark)
        notebook.add(manage_tab, text='📋 Manage Keys')
        
        # Tab 3: Activations
        activation_tab = tk.Frame(notebook, bg=self.bg_dark)
        notebook.add(activation_tab, text='💻 Activations')
        
        # Setup each tab
        self.setup_generate_tab(generate_tab)
        self.setup_manage_tab(manage_tab)
        self.setup_activation_tab(activation_tab)
        
        # Generate Section
        gen_title = tk.Label(
            left_panel,
            text="⚡ Generate New License",
            font=("Segoe UI", 14, "bold"),
            bg=self.bg_panel,
            fg=self.text_white,
            anchor='w'
        )
        gen_title.pack(pady=(20, 15), padx=20, fill='x')
        
        # Duration Selection
        duration_frame = tk.Frame(left_panel, bg=self.bg_panel)
        duration_frame.pack(pady=10, padx=20, fill='x')
        
        tk.Label(
            duration_frame,
            text="Duration:",
            font=("Segoe UI", 10),
            bg=self.bg_panel,
            fg=self.text_gray
        ).pack(anchor='w')
        
        self.duration_var = tk.StringVar(value="365")
        duration_combo = ttk.Combobox(
            duration_frame,
            textvariable=self.duration_var,
            values=["7", "30", "90", "180", "365", "730"],
            state='readonly',
            font=("Segoe UI", 11)
        )
        duration_combo.pack(fill='x', pady=(5, 0))
        
        # Feature Selection
        feature_frame = tk.Frame(left_panel, bg=self.bg_panel)
        feature_frame.pack(pady=10, padx=20, fill='x')
        
        tk.Label(
            feature_frame,
            text="Features:",
            font=("Segoe UI", 10),
            bg=self.bg_panel,
            fg=self.text_gray
        ).pack(anchor='w')
        
        self.feature_var = tk.StringVar(value="voxcpm2")
        feature_combo = ttk.Combobox(
            feature_frame,
            textvariable=self.feature_var,
            values=["voxcpm2", "basic", "premium", "enterprise"],
            state='readonly',
            font=("Segoe UI", 11)
        )
        feature_combo.pack(fill='x', pady=(5, 0))
        
        # Generate Button
        gen_btn_frame = tk.Frame(left_panel, bg=self.bg_panel)
        gen_btn_frame.pack(pady=20, padx=20, fill='x')
        
        self.gen_button = ModernButton(
            gen_btn_frame,
            text="🎯 Generate License Key",
            command=self.generate_key,
            color=self.purple,
            hover_color="#9333EA",
            width=310,
            height=50
        )
        self.gen_button.pack()
        
        # Generated Key Display
        key_display_frame = tk.Frame(left_panel, bg="#1a1a1a")
        key_display_frame.pack(pady=10, padx=20, fill='x')
        
        tk.Label(
            key_display_frame,
            text="Generated Key:",
            font=("Segoe UI", 9),
            bg="#1a1a1a",
            fg=self.text_gray
        ).pack(anchor='w', padx=10, pady=(10, 5))
        
        self.key_display = tk.Text(
            key_display_frame,
            height=2,
            font=("Consolas", 13, "bold"),
            bg="#0a0a0a",
            fg="#22c55e",
            relief='flat',
            wrap='word',
            cursor='arrow'
        )
        self.key_display.pack(padx=10, pady=(0, 10), fill='x')
        self.key_display.config(state='disabled')
        
        # Copy Button
        copy_btn_frame = tk.Frame(left_panel, bg=self.bg_panel)
        copy_btn_frame.pack(pady=10, padx=20, fill='x')
        
        self.copy_button = ModernButton(
            copy_btn_frame,
            text="📋 Copy to Clipboard",
            command=self.copy_key,
            color="#10b981",
            hover_color="#059669",
            width=310,
            height=40
        )
        self.copy_button.pack()
        
        # Right Panel - License List
        right_panel = tk.Frame(main_frame, bg=self.bg_panel, width=380)
        right_panel.pack(side='right', fill='both', expand=True)
        
        list_title = tk.Label(
            right_panel,
            text="📋 All License Keys",
            font=("Segoe UI", 14, "bold"),
            bg=self.bg_panel,
            fg=self.text_white,
            anchor='w'
        )
        list_title.pack(pady=(20, 15), padx=20, fill='x')
        
        # License List with Scrollbar
        list_frame = tk.Frame(right_panel, bg=self.bg_panel)
        list_frame.pack(padx=20, pady=10, fill='both', expand=True)
        
        scrollbar = tk.Scrollbar(list_frame)
        scrollbar.pack(side='right', fill='y')
        
        self.license_list = tk.Listbox(
            list_frame,
            font=("Consolas", 9),
            bg="#0a0a0a",
            fg=self.text_white,
            selectbackground=self.purple,
            selectforeground='white',
            relief='flat',
            yscrollcommand=scrollbar.set,
            activestyle='none'
        )
        self.license_list.pack(side='left', fill='both', expand=True)
        scrollbar.config(command=self.license_list.yview)
        
        # Refresh Button
        refresh_btn_frame = tk.Frame(right_panel, bg=self.bg_panel)
        refresh_btn_frame.pack(pady=15, padx=20, fill='x')
        
        self.refresh_button = ModernButton(
            refresh_btn_frame,
            text="🔄 Refresh List",
            command=self.load_licenses,
            color="#3b82f6",
            hover_color="#2563eb",
            width=340,
            height=40
        )
        self.refresh_button.pack()
        
        # Load initial data
        self.load_licenses()
        
        # Status Bar
        self.status_label = tk.Label(
            self.root,
            text="Ready to generate license keys",
            font=("Segoe UI", 9),
            bg=self.bg_header,
            fg=self.text_gray,
            anchor='w',
            padx=20
        )
        self.status_label.pack(side='bottom', fill='x')
    
    def generate_key(self):
        try:
            days = int(self.duration_var.get())
            feature = self.feature_var.get()
            
            # Animate button
            self.animate_generate()
            
            # Generate key
            key = generate_license_key(days, feature)
            
            # Display key
            self.key_display.config(state='normal')
            self.key_display.delete('1.0', 'end')
            self.key_display.insert('1.0', key)
            self.key_display.config(state='disabled')
            
            # Update status
            self.status_label.config(
                text=f"✅ Generated: {key} | {days} days | {feature}",
                fg="#22c55e"
            )
            
            # Reload list
            self.root.after(500, self.load_licenses)
            
            # Show success animation
            self.show_success_animation()
            
        except Exception as e:
            messagebox.showerror("Error", f"Failed to generate key: {e}")
            self.status_label.config(text=f"❌ Error: {e}", fg="#ef4444")
    
    def copy_key(self):
        try:
            key = self.key_display.get('1.0', 'end').strip()
            if key:
                self.root.clipboard_clear()
                self.root.clipboard_append(key)
                self.status_label.config(text=f"📋 Copied: {key}", fg="#22c55e")
                
                # Flash animation
                self.key_display.config(bg="#22c55e")
                self.root.after(100, lambda: self.key_display.config(bg="#0a0a0a"))
        except Exception as e:
            messagebox.showerror("Error", f"Failed to copy: {e}")
    
    def load_licenses(self):
        try:
            self.license_list.delete(0, 'end')
            licenses = list_all_licenses()
            
            if not licenses:
                self.license_list.insert('end', "No licenses found. Generate one!")
                return
            
            for lic in licenses:
                key = lic.get('key', 'N/A')
                days = lic.get('days_valid', 'N/A')
                feature = lic.get('feature', 'N/A')
                activated = lic.get('is_activated', False)
                status = "🟢 Active" if activated else "⚪ Available"
                
                display = f"{status} | {key} | {days}d | {feature}"
                self.license_list.insert('end', display)
            
            self.status_label.config(
                text=f"📋 Loaded {len(licenses)} license keys",
                fg=self.text_gray
            )
        except Exception as e:
            self.status_label.config(text=f"❌ Error loading licenses: {e}", fg="#ef4444")
    
    def animate_generate(self):
        """Animate generate button"""
        original_text = self.gen_button.text
        self.gen_button.text = "⏳ Generating..."
        self.gen_button.draw()
        self.root.after(800, lambda: self.set_button_text(original_text))
    
    def set_button_text(self, text):
        self.gen_button.text = text
        self.gen_button.draw()
    
    def show_success_animation(self):
        """Show success checkmark animation"""
        popup = tk.Toplevel(self.root)
        popup.title("")
        popup.geometry("300x150")
        popup.configure(bg=self.bg_panel)
        popup.overrideredirect(True)
        
        # Center popup
        popup.update_idletasks()
        x = self.root.winfo_x() + (self.root.winfo_width() // 2) - 150
        y = self.root.winfo_y() + (self.root.winfo_height() // 2) - 75
        popup.geometry(f"+{x}+{y}")
        
        # Success icon
        icon_label = tk.Label(
            popup,
            text="✅",
            font=("Segoe UI", 48),
            bg=self.bg_panel,
            fg="#22c55e"
        )
        icon_label.pack(pady=(20, 10))
        
        # Success text
        text_label = tk.Label(
            popup,
            text="License Key Generated!",
            font=("Segoe UI", 12, "bold"),
            bg=self.bg_panel,
            fg=self.text_white
        )
        text_label.pack()
        
        # Auto close
        self.root.after(1500, popup.destroy)
    
    def animate_particles(self):
        """Background particle animation (subtle)"""
        # This would create floating particles in the background
        # For simplicity, we'll just add a subtle glow effect
        pass


def main():
    root = tk.Tk()
    
    # Set Windows taskbar icon
    try:
        if sys.platform == 'win32':
            import ctypes
            ctypes.windll.shell32.SetCurrentProcessExplicitAppUserModelID('dabber.pro.keygen')
    except:
        pass
    
    app = LicenseKeyGeneratorGUI(root)
    root.mainloop()


if __name__ == "__main__":
    main()
