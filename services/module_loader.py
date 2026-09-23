"""
🔄 Dynamic Module Loader
========================
Hot-swap Python modules at runtime for seamless updates without app restart.
"""

import os
import sys
import importlib
import importlib.util
from pathlib import Path
from typing import Dict, Optional, Any
import threading


class ModuleLoader:
    """Dynamically load and reload Python modules at runtime."""
    
    def __init__(self, base_dir: str = None):
        self.base_dir = Path(base_dir or os.getcwd())
        self.loaded_modules: Dict[str, Any] = {}
        self.module_paths: Dict[str, Path] = {}
        self.lock = threading.Lock()
        
        # Priority paths for loading modules (patches override services override base)
        self.search_paths = [
            self.base_dir / "patches",
            self.base_dir / "services",
            self.base_dir
        ]
    
    def load_module(self, module_name: str, force_reload: bool = False) -> Optional[Any]:
        """
        Load or reload a Python module dynamically.
        
        Args:
            module_name: Name of the module (e.g., 'my_feature' or 'services.my_feature')
            force_reload: Force reload even if already loaded
        
        Returns:
            Loaded module or None if failed
        """
        with self.lock:
            # Check if already loaded and not forcing reload
            if not force_reload and module_name in self.loaded_modules:
                return self.loaded_modules[module_name]
            
            # Find module file
            module_path = self._find_module_path(module_name)
            if not module_path:
                print(f"❌ Module not found: {module_name}")
                return None
            
            try:
                # Load the module
                spec = importlib.util.spec_from_file_location(module_name, module_path)
                if not spec or not spec.loader:
                    print(f"❌ Failed to create module spec: {module_name}")
                    return None
                
                module = importlib.util.module_from_spec(spec)
                sys.modules[module_name] = module
                spec.loader.exec_module(module)
                
                # Cache the loaded module
                self.loaded_modules[module_name] = module
                self.module_paths[module_name] = module_path
                
                print(f"✅ Loaded module: {module_name} from {module_path}")
                return module
            
            except Exception as e:
                print(f"❌ Failed to load module {module_name}: {e}")
                return None
    
    def reload_module(self, module_name: str) -> Optional[Any]:
        """Reload a module (alias for load_module with force_reload=True)."""
        return self.load_module(module_name, force_reload=True)
    
    def unload_module(self, module_name: str) -> bool:
        """Unload a module from memory."""
        with self.lock:
            try:
                if module_name in sys.modules:
                    del sys.modules[module_name]
                if module_name in self.loaded_modules:
                    del self.loaded_modules[module_name]
                if module_name in self.module_paths:
                    del self.module_paths[module_name]
                print(f"✅ Unloaded module: {module_name}")
                return True
            except Exception as e:
                print(f"❌ Failed to unload module {module_name}: {e}")
                return False
    
    def _find_module_path(self, module_name: str) -> Optional[Path]:
        """Find the path to a module file in search paths."""
        # Convert module name to file path (e.g., 'services.my_feature' -> 'services/my_feature.py')
        module_file = module_name.replace('.', os.sep) + '.py'
        
        # Search in priority order
        for search_path in self.search_paths:
            candidate = search_path / module_file
            if candidate.exists():
                return candidate
            
            # Also try without parent directory (e.g., 'my_feature.py' in any search path)
            simple_name = module_name.split('.')[-1] + '.py'
            candidate = search_path / simple_name
            if candidate.exists():
                return candidate
        
        return None
    
    def reload_all(self) -> Dict[str, bool]:
        """Reload all currently loaded modules."""
        results = {}
        for module_name in list(self.loaded_modules.keys()):
            results[module_name] = self.reload_module(module_name) is not None
        return results
    
    def get_module_info(self, module_name: str) -> Optional[Dict]:
        """Get information about a loaded module."""
        if module_name not in self.loaded_modules:
            return None
        
        module = self.loaded_modules[module_name]
        path = self.module_paths.get(module_name)
        
        return {
            "name": module_name,
            "path": str(path) if path else None,
            "loaded": True,
            "attributes": dir(module),
            "doc": module.__doc__
        }
    
    def list_loaded_modules(self) -> list:
        """List all currently loaded modules."""
        return list(self.loaded_modules.keys())
    
    def scan_available_modules(self, pattern: str = "*.py") -> Dict[str, list]:
        """Scan for available modules in search paths."""
        available = {}
        
        for search_path in self.search_paths:
            if not search_path.exists():
                continue
            
            modules = []
            for py_file in search_path.rglob(pattern):
                if py_file.is_file() and not py_file.name.startswith('__'):
                    relative = py_file.relative_to(search_path)
                    module_name = str(relative.with_suffix('')).replace(os.sep, '.')
                    modules.append({
                        "name": module_name,
                        "path": str(py_file),
                        "loaded": module_name in self.loaded_modules
                    })
            
            available[str(search_path.name)] = modules
        
        return available


class HotSwapDecorator:
    """Decorator to make functions hot-swappable."""
    
    def __init__(self, module_loader: ModuleLoader):
        self.loader = module_loader
    
    def __call__(self, func):
        """Wrap a function to be hot-swappable."""
        def wrapper(*args, **kwargs):
            # Try to get the latest version of the function
            module_name = func.__module__
            module = self.loader.loaded_modules.get(module_name)
            
            if module and hasattr(module, func.__name__):
                # Use the latest version from loaded module
                latest_func = getattr(module, func.__name__)
                return latest_func(*args, **kwargs)
            else:
                # Fall back to original function
                return func(*args, **kwargs)
        
        wrapper.__name__ = func.__name__
        wrapper.__doc__ = func.__doc__
        return wrapper


# Global instance
_module_loader: Optional[ModuleLoader] = None


def get_module_loader() -> ModuleLoader:
    """Get or create global ModuleLoader instance."""
    global _module_loader
    if _module_loader is None:
        _module_loader = ModuleLoader()
    return _module_loader


def hot_reload(module_name: str):
    """Convenience function to hot-reload a module."""
    loader = get_module_loader()
    return loader.reload_module(module_name)


def load_plugin(plugin_name: str):
    """Load a plugin module dynamically."""
    loader = get_module_loader()
    return loader.load_module(f"patches.{plugin_name}")
