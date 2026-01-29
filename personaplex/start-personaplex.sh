#!/bin/bash
set -e

echo "🔍 Loading libstdc++ path..."

if [ -f /app/libstdc_path.txt ]; then
  SAVED_PATH=$(cat /app/libstdc_path.txt)
  # Verify saved path is not gcc13
  if [[ "$SAVED_PATH" =~ "gcc-13" ]]; then
    echo "⚠️  Saved path is gcc13 (incompatible), ignoring and searching for gcc12..."
    SAVED_PATH=""
  fi
  # Check if saved path has libstdc++ (either symlink or versioned file)
  if [ -n "$SAVED_PATH" ] && ([ -f "$SAVED_PATH/libstdc++.so.6" ] || [ -f "$SAVED_PATH/libstdc++.so.6.0.30" ] || [ -f "$SAVED_PATH"/libstdc++.so.6.* ]); then
    echo "✅ Using saved path: $SAVED_PATH"
    export LD_LIBRARY_PATH=$LD_LIBRARY_PATH:$SAVED_PATH
  else
    echo "⚠️  Saved path invalid, trying runtime search (excluding gcc13)..."
    # Search for libstdc++.so.6* (with wildcard to find versioned files)
    RUNTIME_PATH=$(find /nix/store -path "*gcc-12*" -name "libstdc++.so.6*" -type f 2>/dev/null | grep -v "gcc-13" | head -1 | xargs dirname 2>/dev/null || echo "")
    if [ -z "$RUNTIME_PATH" ]; then
      RUNTIME_PATH=$(find /nix/store -name "libstdc++.so.6*" -type f 2>/dev/null | grep -v "gcc-13" | head -1 | xargs dirname 2>/dev/null || echo "")
    fi
    if [ -n "$RUNTIME_PATH" ]; then
      echo "✅ Found at runtime: $RUNTIME_PATH"
      export LD_LIBRARY_PATH=$LD_LIBRARY_PATH:$RUNTIME_PATH
    fi
  fi
else
  echo "⚠️  No saved path, searching at runtime (excluding gcc13)..."
  # Try gcc12 first - search for libstdc++.so.6* (with wildcard)
  RUNTIME_PATH=$(find /nix/store -path "*gcc-12*" -name "libstdc++.so.6*" -type f 2>/dev/null | head -1 | xargs dirname 2>/dev/null || echo "")
  if [ -z "$RUNTIME_PATH" ]; then
    # Fallback to any gcc except gcc13
    RUNTIME_PATH=$(find /nix/store -name "libstdc++.so.6*" -type f 2>/dev/null | grep -v "gcc-13" | head -1 | xargs dirname 2>/dev/null || echo "")
  fi
  if [ -n "$RUNTIME_PATH" ]; then
    echo "✅ Found at runtime: $RUNTIME_PATH"
    export LD_LIBRARY_PATH=$LD_LIBRARY_PATH:$RUNTIME_PATH
  else
    echo "❌ libstdc++.so.6 not found! Searching for alternatives..."
    find /nix/store -name "*stdc*" -type f 2>/dev/null | grep -v "gcc-13" | head -10
  fi
fi

echo "📚 LD_LIBRARY_PATH: $LD_LIBRARY_PATH"

echo "🔍 Verifying libstdc++.so.6 is accessible..."
if [ -n "$LD_LIBRARY_PATH" ]; then
  for dir in $(echo $LD_LIBRARY_PATH | tr ":" "\n"); do
    if [ -f "$dir/libstdc++.so.6" ] || [ -f "$dir/libstdc++.so.6.0.30" ] || [ -n "$(find "$dir" -maxdepth 1 -name 'libstdc++.so.6*' -type f 2>/dev/null | head -1)" ]; then
      echo "✅ Verified: libstdc++ found in $dir"
      break
    fi
  done
fi

echo "🚀 Starting PersonaPlex server..."
/app/venv/bin/python -m moshi.server --ssl /tmp/ssl --host 0.0.0.0 --port $PORT --cpu-offload

