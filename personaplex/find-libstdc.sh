#!/bin/bash
set -e

echo "🔍 Finding libstdc++.so.6 during build..."

# Remove old saved path to force fresh search
rm -f /app/libstdc_path.txt

# Try method 1: find in /nix/store, but prefer gcc12 and exclude gcc13
# Search for libstdc++.so.6* (with wildcard to find versioned files like libstdc++.so.6.0.30)
echo "🔍 Searching for gcc12 libstdc++..."
LIB_PATH=$(find /nix/store -path "*gcc-12*" -name "libstdc++.so.6*" -type f 2>/dev/null | head -1 | xargs dirname 2>/dev/null || echo '')
if [ -z "$LIB_PATH" ]; then
  echo "⚠️  gcc12 not found via find, trying any gcc (excluding gcc13)..."
  LIB_PATH=$(find /nix/store -name "libstdc++.so.6*" -type f 2>/dev/null | grep -v "gcc-13" | head -1 | xargs dirname 2>/dev/null || echo '')
fi

# Try method 2: nix-build (try gcc12 first, then gcc11, then default - but skip gcc13)
if [ -z "$LIB_PATH" ]; then
  echo "⚠️  Not found via find, trying nix-build with gcc12..."
  GCC_LIB=$(nix-build -E '(import <nixpkgs> {}).gcc12.cc.lib' --no-out-link 2>/dev/null || echo '')
  if [ -n "$GCC_LIB" ] && [ -d "$GCC_LIB/lib" ] && ([ -f "$GCC_LIB/lib/libstdc++.so.6" ] || [ -f "$GCC_LIB/lib/libstdc++.so.6.0.30" ] || [ -n "$(find "$GCC_LIB/lib" -maxdepth 1 -name 'libstdc++.so.6*' -type f 2>/dev/null | head -1)" ]); then
    LIB_PATH="$GCC_LIB/lib"
    echo "✅ Found via nix-build (gcc12): $LIB_PATH"
  else
    echo "⚠️  gcc12 not found, trying gcc11..."
    GCC_LIB=$(nix-build -E '(import <nixpkgs> {}).gcc11.cc.lib' --no-out-link 2>/dev/null || echo '')
    if [ -n "$GCC_LIB" ] && [ -d "$GCC_LIB/lib" ] && ([ -f "$GCC_LIB/lib/libstdc++.so.6" ] || [ -f "$GCC_LIB/lib/libstdc++.so.6.0.30" ] || [ -n "$(find "$GCC_LIB/lib" -maxdepth 1 -name 'libstdc++.so.6*' -type f 2>/dev/null | head -1)" ]); then
      LIB_PATH="$GCC_LIB/lib"
      echo "✅ Found via nix-build (gcc11): $LIB_PATH"
    else
      echo "⚠️  gcc11 not found, trying default gcc (but will verify it's not gcc13)..."
      GCC_LIB=$(nix-build -E '(import <nixpkgs> {}).gcc.cc.lib' --no-out-link 2>/dev/null || echo '')
      if [ -n "$GCC_LIB" ] && [ -d "$GCC_LIB/lib" ] && [[ ! "$GCC_LIB" =~ "gcc-13" ]] && ([ -f "$GCC_LIB/lib/libstdc++.so.6" ] || [ -f "$GCC_LIB/lib/libstdc++.so.6.0.30" ] || [ -n "$(find "$GCC_LIB/lib" -maxdepth 1 -name 'libstdc++.so.6*' -type f 2>/dev/null | head -1)" ]); then
        LIB_PATH="$GCC_LIB/lib"
        echo "✅ Found via nix-build (default, not gcc13): $LIB_PATH"
      fi
    fi
  fi
fi

# Try method 3: search in common lib directories (excluding gcc13)
if [ -z "$LIB_PATH" ]; then
  echo "⚠️  Trying to search lib directories (excluding gcc13)..."
  for libdir in $(find /nix/store -type d -name 'lib' 2>/dev/null | grep -v "gcc-13" | head -20); do
    if [ -f "$libdir/libstdc++.so.6" ] || [ -f "$libdir/libstdc++.so.6.0.30" ] || [ -n "$(find "$libdir" -maxdepth 1 -name 'libstdc++.so.6*' -type f 2>/dev/null | head -1)" ]; then
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

