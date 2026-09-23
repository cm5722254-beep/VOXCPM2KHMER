using System;
using System.IO;
using System.Net;
using System.Threading;
using System.Diagnostics;
using System.Windows.Forms;
using System.Drawing;

namespace CheatzDabber
{
    class StudioAppContext : ApplicationContext
    {
        private Mutex appMutex = null;
        private Process serverProcess = null;
        private NotifyIcon trayIcon = null;
        private string appDir;

        public StudioAppContext()
        {
            appDir = AppDomain.CurrentDomain.BaseDirectory;
            Log("==========================================");
            Log("App starting in directory: " + appDir);

            // Single instance check
            bool isFirst = true;
            try
            {
                appMutex = new Mutex(true, "Local\\CheatzDabberPro_SingleInstance_Mutex", out isFirst);
            }
            catch (Exception mex)
            {
                Log("Mutex exception: " + mex.Message);
                isFirst = true;
            }

            if (!isFirst)
            {
                Log("Another instance is already running. Opening window and exiting this instance.");
                OpenStudioWindow();
                Environment.Exit(0);
                return;
            }

            try
            {
                EnsureServerStarted();
            }
            catch (Exception ex)
            {
                Log("EnsureServerStarted error: " + ex.Message);
            }

            try
            {
                SetupTrayIcon();
            }
            catch (Exception ex)
            {
                Log("SetupTrayIcon error: " + ex.Message);
            }

            try
            {
                OpenStudioWindow();
            }
            catch (Exception ex)
            {
                Log("OpenStudioWindow error: " + ex.Message);
            }

            Log("Initialization complete. Running message loop.");
        }

        private void Log(string msg)
        {
            try
            {
                string logFile = Path.Combine(appDir, "app_log.txt");
                File.AppendAllText(logFile, DateTime.Now.ToString("yyyy-MM-dd HH:mm:ss") + " | " + msg + Environment.NewLine);
            }
            catch { }
        }

        private bool IsServerHealthy()
        {
            try
            {
                HttpWebRequest req = (HttpWebRequest)WebRequest.Create("http://127.0.0.1:3000/api/config");
                req.Timeout = 1200;
                req.Method = "GET";
                using (HttpWebResponse resp = (HttpWebResponse)req.GetResponse())
                {
                    return resp.StatusCode == HttpStatusCode.OK;
                }
            }
            catch
            {
                return false;
            }
        }

        private void EnsureServerStarted()
        {
            if (IsServerHealthy())
            {
                Log("Server already healthy on port 3000.");
                return;
            }

            // 1. Check if standalone ATITEBDABBERPRO.exe exists (dist or alongside launcher)
            string bundledExe = Path.Combine(appDir, "dist", "ATITEBDABBERPRO", "ATITEBDABBERPRO.exe");
            if (!File.Exists(bundledExe)) bundledExe = Path.Combine(appDir, "ATITEBDABBERPRO.exe");
            if (!File.Exists(bundledExe)) bundledExe = Path.Combine(appDir, "dist", "CheatZDabberPro", "CheatZDabberPro.exe");
            if (!File.Exists(bundledExe)) bundledExe = Path.Combine(appDir, "CheatZDabberPro.exe");

            if (File.Exists(bundledExe))
            {
                Log("Launching standalone CheatZDabberPro: " + bundledExe);
                ProcessStartInfo psiBundled = new ProcessStartInfo();
                psiBundled.FileName = bundledExe;
                psiBundled.WorkingDirectory = Path.GetDirectoryName(bundledExe);
                psiBundled.UseShellExecute = true;
                try
                {
                    serverProcess = Process.Start(psiBundled);
                    Log("Standalone process started with PID: " + serverProcess.Id);
                }
                catch (Exception ex)
                {
                    Log("Failed to launch standalone process: " + ex.Message);
                }
                return;
            }

            // 2. Launch Python FastAPI Server
            string pyPath = Path.Combine(appDir, ".venv", "Scripts", "python.exe");
            if (!File.Exists(pyPath)) pyPath = Path.Combine(appDir, ".venv312", "Scripts", "python.exe");
            if (!File.Exists(pyPath)) pyPath = "python.exe";

            string pyScript = Path.Combine(appDir, "server.py");
            Log("Starting Python server from: " + pyPath + " with script: " + pyScript);

            ProcessStartInfo psi = new ProcessStartInfo();
            psi.FileName = pyPath;
            psi.Arguments = "\"" + pyScript + "\"";
            psi.WorkingDirectory = appDir;
            psi.UseShellExecute = false;
            psi.CreateNoWindow = true;
            psi.WindowStyle = ProcessWindowStyle.Hidden;

            try
            {
                serverProcess = Process.Start(psi);
                Log("Python server process launched with PID: " + serverProcess.Id);
            }
            catch (Exception ex)
            {
                Log("Failed to launch python process: " + ex.Message);
            }

            for (int i = 0; i < 40; i++)
            {
                Thread.Sleep(500);
                if (IsServerHealthy())
                {
                    Log("Server became healthy after " + ((i + 1) * 500) + "ms");
                    return;
                }
            }
            Log("Server wait loop ended.");
        }

        public void OpenStudioWindow()
        {
            string edge1 = @"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe";
            string edge2 = @"C:\Program Files\Microsoft\Edge\Application\msedge.exe";
            string chrome1 = @"C:\Program Files\Google\Chrome\Application\chrome.exe";
            string chrome2 = @"C:\Program Files (x86)\Google\Chrome\Application\chrome.exe";

            string browserPath = null;
            if (File.Exists(edge1)) browserPath = edge1;
            else if (File.Exists(edge2)) browserPath = edge2;
            else if (File.Exists(chrome1)) browserPath = chrome1;
            else if (File.Exists(chrome2)) browserPath = chrome2;

            Log("Launching browser: " + (browserPath ?? "default"));
            if (browserPath != null)
            {
                ProcessStartInfo psi = new ProcessStartInfo();
                psi.FileName = browserPath;
                psi.Arguments = "--app=http://localhost:3000 --window-size=1366,850";
                Process.Start(psi);
            }
            else
            {
                Process.Start("http://localhost:3000");
            }
        }

        private void SetupTrayIcon()
        {
            trayIcon = new NotifyIcon();
            trayIcon.Text = "Cheatz Dabber.PRO";

            string iconPath = Path.Combine(appDir, "app_icon.ico");
            if (File.Exists(iconPath))
            {
                try { trayIcon.Icon = new Icon(iconPath); } catch { trayIcon.Icon = SystemIcons.Application; }
            }
            else
            {
                trayIcon.Icon = SystemIcons.Application;
            }

            ContextMenu contextMenu = new ContextMenu();
            MenuItem itemOpen = new MenuItem("🎬 បើកផ្ទាំង Studio (Open Studio)", (s, e) => OpenStudioWindow());
            itemOpen.DefaultItem = true;
            contextMenu.MenuItems.Add(itemOpen);
            contextMenu.MenuItems.Add(new MenuItem("🌐 បើកក្នុង Browser ធម្មតា", (s, e) => Process.Start("http://localhost:3000")));
            contextMenu.MenuItems.Add("-");
            MenuItem itemStatus = new MenuItem("🟢 Server: Online (Port 3000)");
            itemStatus.Enabled = false;
            contextMenu.MenuItems.Add(itemStatus);
            contextMenu.MenuItems.Add("-");
            contextMenu.MenuItems.Add(new MenuItem("❌ បិទកម្មវិធីទាំងស្រុង (Exit)", (s, e) => {
                ExitThread();
            }));

            trayIcon.ContextMenu = contextMenu;
            trayIcon.DoubleClick += (s, e) => OpenStudioWindow();
            trayIcon.Visible = true;
            Log("Tray icon initialized successfully.");
        }

        protected override void ExitThreadCore()
        {
            Log("ExitThreadCore invoked. Cleaning up resources...");
            if (trayIcon != null)
            {
                trayIcon.Visible = false;
                trayIcon.Dispose();
                trayIcon = null;
            }

            if (serverProcess != null && !serverProcess.HasExited)
            {
                try { serverProcess.Kill(); } catch {}
                serverProcess = null;
            }

            if (appMutex != null)
            {
                try { appMutex.ReleaseMutex(); } catch {}
                appMutex = null;
            }

            base.ExitThreadCore();
        }
    }

    static class Program
    {
        [STAThread]
        static void Main()
        {
            try
            {
                Application.EnableVisualStyles();
                Application.SetCompatibleTextRenderingDefault(false);
                Application.Run(new StudioAppContext());
            }
            catch (Exception ex)
            {
                try
                {
                    string logFile = Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "app_log.txt");
                    File.AppendAllText(logFile, "FATAL EXCEPTION in Main: " + ex.ToString() + Environment.NewLine);
                }
                catch { }
            }
        }
    }
}
