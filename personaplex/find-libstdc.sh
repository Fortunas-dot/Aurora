#!/bin/bash
set -e

echo "🔍 Finding libstdc++.so.6 during build..."

# Try method 1: find in /nix/store
LIB_PATH=$(find /nix/store -name libstdc++.so.6 -type f 2>/dev/null | head -1 | xargs dirname 2>/dev/null || echo '')

# Try method 2: nix-build (try gcc12 first, then default)
if [ -z "$LIB_PATH" ]; then
  echo "⚠️  Not found via find, trying nix-build with gcc12..."
  GCC_LIB=$(nix-build -E '(import <nixpkgs> {}).gcc12.cc.lib' --no-out-link 2>/dev/null || echo '')
  if [ -n "$GCC_LIB" ] && [ -d "$GCC_LIB/lib" ]; then
    LIB_PATH="$GCC_LIB/lib"
    echo "✅ Found via nix-build (gcc12): $LIB_PATH"
  else
    echo "⚠️  gcc12 not found, trying default gcc..."
    GCC_LIB=$(nix-build -E '(import <nixpkgs> {}).gcc.cc.lib' --no-out-link 2>/dev/null || echo '')
    if [ -n "$GCC_LIB" ] && [ -d "$GCC_LIB/lib" ]; then
      LIB_PATH="$GCC_LIB/lib"
      echo "✅ Found via nix-build (default): $LIB_PATH"
    fi
  fi
fi

# Try method 3: search in common lib directories
if [ -z "$LIB_PATH" ]; then
  echo "⚠️  Trying to search lib directories..."
  for libdir in $(find /nix/store -type d -name 'lib' 2>/dev/null | head -20); do
    if [ -f "$libdir/libstdc++.so.6" ]; then
      LIB_PATH="$libdir"
      echo "✅ Found in: $LIB_PATH"
      break
    fi
  done
fi

# Save the path
if [ -n "$LIB_PATH" ]; then
  echo "✅ Saving libstdc++ path: $LIB_PATH"
  echo "$LIB_PATH" > /app/libstdc_path.txt
else
  echo "❌ libstdc++.so.6 not found during build!"
  echo "Available stdc++ files:"
  find /nix/store -name "*stdc*" -type f 2>/dev/null | head -10
  echo "⚠️  Will try to find at runtime instead"
  # Don't exit with error, let runtime script handle it
fi

