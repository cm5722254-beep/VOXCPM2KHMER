"""
🔑 DABBER PRO - Enhanced License Key Generator GUI
Beautiful animated license key generator with modern tabbed interface
"""

import tkinter as tk
from tkinter import ttk, messagebox, scrolledtext
import sys
import os
from datetime import datetime, timedelta
import random
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
    """Custom animated button with hover effects"""
    def __init__(self, parent, text, command, color="#A855F7", hover_color="#9333EA", **kwargs):
        super().__init__(parent, **kwargs)
        self.text = text
        self.command = command
        self.color = color
        self.hover_color = hover_color
        self.is_hovered = False
        
        self.config(highlightthickness=0, bg=parent.cget('bg'))
        
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
            x1+radius, y1, x1+radius, y1, x2-radius, y1, x2-radius, y1,
            x2, y1, x2, y1+radius, x2, y1+radius, x2, y2-radius,
            x2, y2-radius, x2, y2, x2-radius, y2, x2-radius, y2,
            x1+radius, y2, x1+radius, y2, x1, y2, x1, y2-radius,
            x1, y2-radius, x1, y1+radius, x1, y1+radius, x1, y1
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
        self.root.geometry("1100x750")
        self.root.resizable(True, True)
        self.root.minsize(900, 600)
        
        # Colors
        self.bg_dark = "#0a0a0a"
        self.bg_panel = "#111111"
        self.bg_card = "#1a1a1a"
        self.bg_header = "#0f0f0f"
        self.purple = "#A855F7"
        self.pink = "#EC4899"
        self.blue = "#3b82f6"
        self.green = "#10b981"
        self.text_white = "#ffffff"
        self.text_gray = "#9ca3af"
        
        self.root.configure(bg=self.bg_dark)
        
        # Animation variables
        self.particles = []
        self.animation_running = True
        
        # Initialize database
        try:
            init_license_db()
        except Exception as e:
            print(f"Database init: {e}")
        
        self.setup_ui()
        self.animate_background()
        
    def setup_ui(self):
        # Animated Background Canvas
        self.bg_canvas = tk.Canvas(self.root, bg=self.bg_dark, highlightthickness=0)
        self.bg_canvas.place(x=0, y=0, relwidth=1, relheight=1)
        
        # Create floating particles
        for _ in range(40):
            self.create_particle()
        
        # Main Container (on top of canvas)
        main_container = tk.Frame(self.root, bg='')
        main_container.place(x=0, y=0, relwidth=1, relheight=1)
        
        # Header with gradient effect
        header = tk.Frame(main_container, bg=self.bg_header, height=110)
        header.pack(fill='x', pady=(0, 10))
        header.pack_propagate(False)
        
        # Animated title
        title_label = tk.Label(
            header,
            text="💎 DABBER PRO",
            font=("Segoe UI", 32, "bold"),
            bg=self.bg_header,
            fg=self.text_white
        )
        title_label.pack(pady=(20, 5))
        
        subtitle = tk.Label(
            header,
            text="✨ Professional License Key Generator & Management System ✨",
            font=("Segoe UI", 11),
            bg=self.bg_header,
            fg=self.text_gray
        )
        subtitle.pack()
        
        # Main Content with Tabs
        content_frame = tk.Frame(main_container, bg=self.bg_dark)
        content_frame.pack(fill='both', expand=True, padx=20, pady=10)
        
        # Create notebook for tabs
        style = ttk.Style()
        style.theme_use('default')
        style.configure('TNotebook', background=self.bg_dark, borderwidth=0, tabmargins=[10, 5, 10, 0])
        style.configure('TNotebook.Tab', 
                       background=self.bg_card, 
                       foreground=self.text_gray,
                       padding=[25, 12],
                       font=('Segoe UI', 11, 'bold'),
                       borderwidth=0)
        style.map('TNotebook.Tab',
                 background=[('selected', self.purple)],
                 foreground=[('selected', self.text_white)],
                 expand=[('selected', [1, 1, 1, 0])])
        
        self.notebook = ttk.Notebook(content_frame)
        self.notebook.pack(fill='both', expand=True)
        
        # Tab 1: Generate Keys
        generate_tab = tk.Frame(self.notebook, bg=self.bg_dark)
        self.notebook.add(generate_tab, text='⚡ Generate Key')
        
        # Tab 2: Manage Keys
        manage_tab = tk.Frame(self.notebook, bg=self.bg_dark)
        self.notebook.add(manage_tab, text='📋 Manage Keys')
        
        # Tab 3: Activations
        activation_tab = tk.Frame(self.notebook, bg=self.bg_dark)
        self.notebook.add(activation_tab, text='💻 Activations')
        
        # Tab 4: Statistics
        stats_tab = tk.Frame(self.notebook, bg=self.bg_dark)
        self.notebook.add(stats_tab, text='📊 Statistics')
        
        # Setup each tab
        self.setup_generate_tab(generate_tab)
        self.setup_manage_tab(manage_tab)
        self.setup_activation_tab(activation_tab)
        self.setup_stats_tab(stats_tab)
        
        # Status Bar
        status_frame = tk.Frame(main_container, bg=self.bg_header, height=35)
        status_frame.pack(side='bottom', fill='x')
        status_frame.pack_propagate(False)
        
        self.status_label = tk.Label(
            status_frame,
            text="🟢 Ready to generate license keys",
            font=("Segoe UI", 9),
            bg=self.bg_header,
            fg=self.text_gray,
            anchor='w',
            padx=15
        )
        self.status_label.pack(side='left', fill='x', expand=True)
        
    def create_particle(self):
        """Create a floating particle"""
        x = random.randint(0, 1100)
        y = random.randint(0, 750)
        size = random.randint(2, 6)
        speed = random.uniform(0.3, 1.5)
        color = random.choice([self.purple, self.pink, self.blue, "#8b5cf6"])
        
        particle = self.bg_canvas.create_oval(
            x, y, x+size, y+size,
            fill=color,
            outline="",
            tags="particle"
        )
        
        self.particles.append({
            'id': particle,
            'x': x,
            'y': y,
            'size': size,
            'speed': speed,
            'angle': random.uniform(0, 2 * math.pi),
            'opacity': random.uniform(0.3, 0.8)
        })
    
    def animate_background(self):
        """Animate floating particles"""
        if not self.animation_running:
            return
        
        for particle in self.particles:
            # Move particle
            particle['x'] += math.cos(particle['angle']) * particle['speed']
            particle['y'] += math.sin(particle['angle']) * particle['speed']
            
            # Bounce off edges
            if particle['x'] < 0 or particle['x'] > 1100:
                particle['angle'] = math.pi - particle['angle']
            if particle['y'] < 0 or particle['y'] > 750:
                particle['angle'] = -particle['angle']
            
            # Update position
            size = particle['size']
            self.bg_canvas.coords(
                particle['id'],
                particle['x'], particle['y'],
                particle['x'] + size, particle['y'] + size
            )
        
        # Continue animation
        self.root.after(50, self.animate_background)
    
    def setup_generate_tab(self, parent):
        """Setup generate key tab"""
        # Main panel
        panel = tk.Frame(parent, bg=self.bg_panel)
        panel.pack(fill='both', expand=True, padx=20, pady=20)
        
        # Title
        tk.Label(
            panel,
            text="⚡ Generate New License Key",
            font=("Segoe UI", 16, "bold"),
            bg=self.bg_panel,
            fg=self.text_white
        ).pack(pady=(20, 10))
        
        tk.Label(
            panel,
            text="Create a new license key for customer activation",
            font=("Segoe UI", 9),
            bg=self.bg_panel,
            fg=self.text_gray
        ).pack(pady=(0, 20))
        
        # Form container
        form_container = tk.Frame(panel, bg=self.bg_panel)
        form_container.pack(pady=20, padx=50, fill='both', expand=True)
        
        # Duration
        duration_frame = tk.Frame(form_container, bg=self.bg_panel)
        duration_frame.pack(pady=15, fill='x')
        
        tk.Label(
            duration_frame,
            text="⏰ Validity Period:",
            font=("Segoe UI", 11, "bold"),
            bg=self.bg_panel,
            fg=self.text_white
        ).pack(anchor='w', pady=(0, 5))
        
        self.duration_var = tk.StringVar(value="365")
        duration_combo = ttk.Combobox(
            duration_frame,
            textvariable=self.duration_var,
            values=["7 Days (Trial)", "30 Days (1 Month)", "90 Days (3 Months)", 
                   "180 Days (6 Months)", "365 Days (1 Year)", "730 Days (2 Years)", "0 Days (Lifetime)"],
            state='readonly',
            font=("Segoe UI", 11),
            width=40
        )
        duration_combo.current(4)
        duration_combo.pack(fill='x', pady=(0, 5))
        
        # Max Activations
        activation_frame = tk.Frame(form_container, bg=self.bg_panel)
        activation_frame.pack(pady=15, fill='x')
        
        tk.Label(
            activation_frame,
            text="💻 Maximum Activations:",
            font=("Segoe UI", 11, "bold"),
            bg=self.bg_panel,
            fg=self.text_white
        ).pack(anchor='w', pady=(0, 5))
        
        self.max_activations_var = tk.StringVar(value="1")
        tk.Entry(
            activation_frame,
            textvariable=self.max_activations_var,
            font=("Segoe UI", 11),
            bg=self.bg_card,
            fg=self.text_white,
            insertbackground=self.text_white,
            relief='flat',
            bd=10
        ).pack(fill='x')
        
        # Notes
        notes_frame = tk.Frame(form_container, bg=self.bg_panel)
        notes_frame.pack(pady=15, fill='x')
        
        tk.Label(
            notes_frame,
            text="📝 Customer Notes (Optional):",
            font=("Segoe UI", 11, "bold"),
            bg=self.bg_panel,
            fg=self.text_white
        ).pack(anchor='w', pady=(0, 5))
        
        self.notes_var = tk.StringVar()
        tk.Entry(
            notes_frame,
            textvariable=self.notes_var,
            font=("Segoe UI", 11),
            bg=self.bg_card,
            fg=self.text_white,
            insertbackground=self.text_white,
            relief='flat',
            bd=10
        ).pack(fill='x')
        
        # Generate Button
        btn_frame = tk.Frame(form_container, bg=self.bg_panel)
        btn_frame.pack(pady=30)
        
        self.gen_button = ModernButton(
            btn_frame,
            text="🎯 Generate License Key",
            command=self.generate_key,
            color=self.purple,
            hover_color="#9333EA",
            width=400,
            height=55
        )
        self.gen_button.pack()
        
        # Key Display
        display_frame = tk.Frame(form_container, bg=self.bg_card, relief='solid', bd=2)
        display_frame.pack(pady=20, fill='x')
        
        tk.Label(
            display_frame,
            text="🔑 Generated License Key:",
            font=("Segoe UI", 10, "bold"),
            bg=self.bg_card,
            fg=self.text_gray
        ).pack(anchor='w', padx=15, pady=(15, 5))
        
        self.key_display = tk.Text(
            display_frame,
            height=2,
            font=("Consolas", 14, "bold"),
            bg="#0a0a0a",
            fg=self.green,
            relief='flat',
            wrap='word',
            cursor='arrow',
            bd=0
        )
        self.key_display.pack(padx=15, pady=(0, 10), fill='x')
        self.key_display.config(state='disabled')
        
        # Copy Button
        copy_btn_frame = tk.Frame(display_frame, bg=self.bg_card)
        copy_btn_frame.pack(pady=(0, 15))
        
        self.copy_button = ModernButton(
            copy_btn_frame,
            text="📋 Copy to Clipboard",
            command=self.copy_key,
            color=self.green,
            hover_color="#059669",
            width=200,
            height=40
        )
        self.copy_button.pack()
    
    def setup_manage_tab(self, parent):
        """Setup manage keys tab"""
        panel = tk.Frame(parent, bg=self.bg_panel)
        panel.pack(fill='both', expand=True, padx=20, pady=20)
        
        # Title
        tk.Label(
            panel,
            text="📋 All License Keys",
            font=("Segoe UI", 16, "bold"),
            bg=self.bg_panel,
            fg=self.text_white
        ).pack(pady=(20, 10))
        
        # Search Frame
        search_frame = tk.Frame(panel, bg=self.bg_panel)
        search_frame.pack(pady=10, padx=20, fill='x')
        
        tk.Label(
            search_frame,
            text="🔍",
            font=("Segoe UI", 14),
            bg=self.bg_panel,
            fg=self.text_gray
        ).pack(side='left', padx=(0, 5))
        
        self.search_var = tk.StringVar()
        self.search_var.trace('w', lambda *args: self.load_licenses())
        
        tk.Entry(
            search_frame,
            textvariable=self.search_var,
            font=("Segoe UI", 11),
            bg=self.bg_card,
            fg=self.text_white,
            insertbackground=self.text_white,
            relief='flat',
            bd=10
        ).pack(side='left', fill='x', expand=True)
        
        # License List with Treeview
        list_frame = tk.Frame(panel, bg=self.bg_panel)
        list_frame.pack(padx=20, pady=10, fill='both', expand=True)
        
        # Scrollbar
        scrollbar = tk.Scrollbar(list_frame)
        scrollbar.pack(side='right', fill='y')
        
        # Treeview
        columns = ('Key', 'Days', 'Activations', 'Created', 'Status')
        self.license_tree = ttk.Treeview(
            list_frame,
            columns=columns,
            show='tree headings',
            yscrollcommand=scrollbar.set,
            selectmode='browse'
        )
        
        # Configure columns
        self.license_tree.column('#0', width=30, stretch=False)
        self.license_tree.column('Key', width=200)
        self.license_tree.column('Days', width=80)
        self.license_tree.column('Activations', width=100)
        self.license_tree.column('Created', width=150)
        self.license_tree.column('Status', width=80)
        
        # Headings
        self.license_tree.heading('Key', text='License Key')
        self.license_tree.heading('Days', text='Validity')
        self.license_tree.heading('Activations', text='Activations')
        self.license_tree.heading('Created', text='Created')
        self.license_tree.heading('Status', text='Status')
        
        self.license_tree.pack(side='left', fill='both', expand=True)
        scrollbar.config(command=self.license_tree.yview)
        
        # Refresh Button
        refresh_frame = tk.Frame(panel, bg=self.bg_panel)
        refresh_frame.pack(pady=15, padx=20)
        
        ModernButton(
            refresh_frame,
            text="🔄 Refresh List",
            command=self.load_licenses,
            color=self.blue,
            hover_color="#2563eb",
            width=200,
            height=40
        ).pack()
        
    def setup_activation_tab(self, parent):
        """Setup activations tab"""
        panel = tk.Frame(parent, bg=self.bg_panel)
        panel.pack(fill='both', expand=True, padx=20, pady=20)
        
        # Title
        tk.Label(
            panel,
            text="💻 Machine Activations",
            font=("Segoe UI", 16, "bold"),
            bg=self.bg_panel,
            fg=self.text_white
        ).pack(pady=(20, 10))
        
        # Activation List
        list_frame = tk.Frame(panel, bg=self.bg_panel)
        list_frame.pack(padx=20, pady=10, fill='both', expand=True)
        
        scrollbar = tk.Scrollbar(list_frame)
        scrollbar.pack(side='right', fill='y')
        
        columns = ('Machine', 'Key', 'Computer', 'Activated', 'Expires')
        self.activation_tree = ttk.Treeview(
            list_frame,
            columns=columns,
            show='tree headings',
            yscrollcommand=scrollbar.set
        )
        
        self.activation_tree.column('#0', width=30, stretch=False)
        self.activation_tree.column('Machine', width=150)
        self.activation_tree.column('Key', width=180)
        self.activation_tree.column('Computer', width=120)
        self.activation_tree.column('Activated', width=140)
        self.activation_tree.column('Expires', width=140)
        
        self.activation_tree.heading('Machine', text='Machine ID')
        self.activation_tree.heading('Key', text='License Key')
        self.activation_tree.heading('Computer', text='Computer')
        self.activation_tree.heading('Activated', text='Activated')
        self.activation_tree.heading('Expires', text='Expires')
        
        self.activation_tree.pack(side='left', fill='both', expand=True)
        scrollbar.config(command=self.activation_tree.yview)
        
        # Buttons
        btn_frame = tk.Frame(panel, bg=self.bg_panel)
        btn_frame.pack(pady=15)
        
        ModernButton(
            btn_frame,
            text="🔄 Refresh",
            command=self.load_activations,
            color=self.blue,
            hover_color="#2563eb",
            width=150,
            height=40
        ).pack(side='left', padx=5)
        
        ModernButton(
            btn_frame,
            text="🔓 Deactivate Selected",
            command=self.deactivate_selected,
            color="#ef4444",
            hover_color="#dc2626",
            width=180,
            height=40
        ).pack(side='left', padx=5)
    
    def setup_stats_tab(self, parent):
        """Setup statistics tab"""
        panel = tk.Frame(parent, bg=self.bg_panel)
        panel.pack(fill='both', expand=True, padx=20, pady=20)
        
        # Title
        tk.Label(
            panel,
            text="📊 Statistics Dashboard",
            font=("Segoe UI", 16, "bold"),
            bg=self.bg_panel,
            fg=self.text_white
        ).pack(pady=(20, 20))
        
        # Stats Grid
        stats_grid = tk.Frame(panel, bg=self.bg_panel)
        stats_grid.pack(fill='both', expand=True, padx=30, pady=10)
        
        # Stat Cards
        self.create_stat_card(stats_grid, "🔑 Total Keys", "0", self.purple, 0, 0)
        self.create_stat_card(stats_grid, "💻 Active Licenses", "0", self.green, 0, 1)
        self.create_stat_card(stats_grid, "⏰ Expiring Soon", "0", "#f59e0b", 1, 0)
        self.create_stat_card(stats_grid, "✨ Lifetime Keys", "0", self.blue, 1, 1)
        
        # Refresh Stats Button
        ModernButton(
            panel,
            text="🔄 Refresh Statistics",
            command=self.load_stats,
            color=self.blue,
            hover_color="#2563eb",
            width=250,
            height=45
        ).pack(pady=30)
        
    def create_stat_card(self, parent, title, value, color, row, col):
        """Create a statistics card"""
        card = tk.Frame(parent, bg=self.bg_card, relief='flat', bd=2)
        card.grid(row=row, column=col, padx=15, pady=15, sticky='nsew')
        
        parent.grid_rowconfigure(row, weight=1)
        parent.grid_columnconfigure(col, weight=1)
        
        tk.Label(
            card,
            text=title,
            font=("Segoe UI", 12),
            bg=self.bg_card,
            fg=self.text_gray
        ).pack(pady=(20, 5))
        
        value_label = tk.Label(
            card,
            text=value,
            font=("Segoe UI", 32, "bold"),
            bg=self.bg_card,
            fg=color
        )
        value_label.pack(pady=(0, 20))
        
        # Store reference
        if not hasattr(self, 'stat_labels'):
            self.stat_labels = {}
        self.stat_labels[title] = value_label
    
    def generate_key(self):
        """Generate new license key"""
        try:
            # Parse duration
            duration_text = self.duration_var.get()
            if "Lifetime" in duration_text or duration_text.startswith("0"):
                days = 0
            else:
                days = int(duration_text.split()[0])
            
            max_act = int(self.max_activations_var.get() or 1)
            notes = self.notes_var.get().strip()
            
            # Generate key
            key = create_license_key(days_valid=days, max_activations=max_act, notes=notes)
            
            # Display key
            self.key_display.config(state='normal')
            self.key_display.delete('1.0', 'end')
            self.key_display.insert('1.0', key)
            self.key_display.config(state='disabled')
            
            # Update status
            validity = "Lifetime" if days == 0 else f"{days} days"
            self.status_label.config(
                text=f"✅ Generated: {key} | Valid for: {validity}",
                fg=self.green
            )
            
            # Show success animation
            self.show_success_popup("License Key Generated!")
            
            # Reload lists
            self.root.after(500, self.load_licenses)
            self.root.after(500, self.load_stats)
            
        except Exception as e:
            messagebox.showerror("Error", f"Failed to generate key:\n{e}")
            self.status_label.config(text=f"❌ Error: {e}", fg="#ef4444")
    
    def copy_key(self):
        """Copy key to clipboard"""
        try:
            key = self.key_display.get('1.0', 'end').strip()
            if key:
                self.root.clipboard_clear()
                self.root.clipboard_append(key)
                self.status_label.config(text=f"📋 Copied: {key}", fg=self.green)
                
                # Flash animation
                self.key_display.config(bg=self.green)
                self.root.after(150, lambda: self.key_display.config(bg="#0a0a0a"))
        except Exception as e:
            messagebox.showerror("Error", f"Failed to copy: {e}")
    
    def load_licenses(self):
        """Load all license keys"""
        try:
            # Clear existing
            for item in self.license_tree.get_children():
                self.license_tree.delete(item)
            
            # Get licenses
            licenses = list_all_license_keys()
            
            # Filter by search
            search_term = self.search_var.get().lower()
            if search_term:
                licenses = [l for l in licenses if search_term in l.get('key_code', '').lower()]
            
            # Add to tree
            for lic in licenses:
                key = lic.get('key_code', 'N/A')
                days = "Lifetime" if lic.get('days_valid', 0) == 0 else f"{lic.get('days_valid')} days"
                current = lic.get('current_activations', 0)
                max_act = lic.get('max_activations', 0)
                created = lic.get('created_at', 'N/A')[:16]
                status = "🟢 Active" if lic.get('is_active') else "⚪ Inactive"
                
                self.license_tree.insert('', 'end', text='', values=(
                    key, days, f"{current}/{max_act}", created, status
                ))
            
            self.status_label.config(
                text=f"📋 Loaded {len(licenses)} license keys",
                fg=self.text_gray
            )
        except Exception as e:
            self.status_label.config(text=f"❌ Error: {e}", fg="#ef4444")
    
    def load_activations(self):
        """Load all activations"""
        try:
            # Clear existing
            for item in self.activation_tree.get_children():
                self.activation_tree.delete(item)
            
            # Get activations
            activations = list_all_activations()
            
            # Add to tree
            for act in activations:
                machine = act.get('machine_id', 'N/A')[:20] + '...'
                key = act.get('key_code', 'N/A')
                computer = act.get('computer_name', 'Unknown')
                activated = act.get('activated_at', 'N/A')[:16]
                expires = act.get('expires_at', 'Lifetime')[:16] if act.get('expires_at') else 'Lifetime'
                
                self.activation_tree.insert('', 'end', text='', values=(
                    machine, key, computer, activated, expires
                ))
            
            self.status_label.config(
                text=f"💻 Loaded {len(activations)} activations",
                fg=self.text_gray
            )
        except Exception as e:
            self.status_label.config(text=f"❌ Error: {e}", fg="#ef4444")
    
    def deactivate_selected(self):
        """Deactivate selected machine"""
        try:
            selected = self.activation_tree.selection()
            if not selected:
                messagebox.showwarning("No Selection", "Please select an activation to deactivate")
                return
            
            item = self.activation_tree.item(selected[0])
            machine_id_short = item['values'][0]
            
            # Get full machine ID
            activations = list_all_activations()
            machine_id = None
            for act in activations:
                if act.get('machine_id', '').startswith(machine_id_short.replace('...', '')):
                    machine_id = act.get('machine_id')
                    break
            
            if not machine_id:
                messagebox.showerror("Error", "Machine ID not found")
                return
            
            # Confirm
            if not messagebox.askyesno("Confirm", f"Deactivate this machine?\n\n{item['values'][2]}"):
                return
            
            # Deactivate
            result = deactivate_machine(machine_id)
            
            if result.get('success'):
                messagebox.showinfo("Success", result.get('message', 'Deactivated'))
                self.load_activations()
                self.load_stats()
            else:
                messagebox.showerror("Error", result.get('error', 'Failed'))
                
        except Exception as e:
            messagebox.showerror("Error", f"Failed to deactivate:\n{e}")
    
    def load_stats(self):
        """Load statistics"""
        try:
            licenses = list_all_license_keys()
            activations = list_all_activations()
            
            total_keys = len(licenses)
            active_licenses = len([l for l in licenses if l.get('current_activations', 0) > 0])
            lifetime_keys = len([l for l in licenses if l.get('days_valid', 0) == 0])
            
            # Update stat cards
            if hasattr(self, 'stat_labels'):
                self.stat_labels["🔑 Total Keys"].config(text=str(total_keys))
                self.stat_labels["💻 Active Licenses"].config(text=str(active_licenses))
                self.stat_labels["⏰ Expiring Soon"].config(text="0")  # TODO: Calculate
                self.stat_labels["✨ Lifetime Keys"].config(text=str(lifetime_keys))
            
        except Exception as e:
            print(f"Stats error: {e}")
    
    def show_success_popup(self, message):
        """Show success animation popup"""
        popup = tk.Toplevel(self.root)
        popup.title("")
        popup.geometry("350x180")
        popup.configure(bg=self.bg_card)
        popup.overrideredirect(True)
        
        # Center popup
        popup.update_idletasks()
        x = self.root.winfo_x() + (self.root.winfo_width() // 2) - 175
        y = self.root.winfo_y() + (self.root.winfo_height() // 2) - 90
        popup.geometry(f"+{x}+{y}")
        
        # Success icon
        tk.Label(
            popup,
            text="✅",
            font=("Segoe UI", 56),
            bg=self.bg_card,
            fg=self.green
        ).pack(pady=(25, 10))
        
        # Success text
        tk.Label(
            popup,
            text=message,
            font=("Segoe UI", 13, "bold"),
            bg=self.bg_card,
            fg=self.text_white
        ).pack(pady=(0, 25))
        
        # Auto close
        self.root.after(1800, popup.destroy)
    
    def on_closing(self):
        """Handle window closing"""
        self.animation_running = False
        self.root.destroy()


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
    root.protocol("WM_DELETE_WINDOW", app.on_closing)
    
    # Load initial data
    app.load_licenses()
    app.load_activations()
    app.load_stats()
    
    root.mainloop()


if __name__ == "__main__":
    main()
