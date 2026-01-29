#!/bin/bash
set -e

echo "🔍 Loading libstdc++ path..."

if [ -f /app/libstdc_path.txt ]; then
  SAVED_PATH=$(cat /app/libstdc_path.txt)
  if [ -n "$SAVED_PATH" ] && [ -f "$SAVED_PATH/libstdc++.so.6" ]; then
    echo "✅ Using saved path: $SAVED_PATH"
    export LD_LIBRARY_PATH=$LD_LIBRARY_PATH:$SAVED_PATH
  else
    echo "⚠️  Saved path invalid, trying runtime search..."
    RUNTIME_PATH=$(find /nix/store -name libstdc++.so.6 -type f 2>/dev/null | head -1 | xargs dirname 2>/dev/null || echo "")
    if [ -n "$RUNTIME_PATH" ]; then
      echo "✅ Found at runtime: $RUNTIME_PATH"
      export LD_LIBRARY_PATH=$LD_LIBRARY_PATH:$RUNTIME_PATH
    fi
  fi
else
  echo "⚠️  No saved path, searching at runtime..."
  RUNTIME_PATH=$(find /nix/store -name libstdc++.so.6 -type f 2>/dev/null | head -1 | xargs dirname 2>/dev/null || echo "")
  if [ -n "$RUNTIME_PATH" ]; then
    echo "✅ Found at runtime: $RUNTIME_PATH"
    export LD_LIBRARY_PATH=$LD_LIBRARY_PATH:$RUNTIME_PATH
  else
    echo "❌ libstdc++.so.6 not found! Searching for alternatives..."
    find /nix/store -name "*stdc*" -type f 2>/dev/null | head -10
  fi
fi

echo "📚 LD_LIBRARY_PATH: $LD_LIBRARY_PATH"

echo "🔍 Verifying libstdc++.so.6 is accessible..."
if [ -n "$LD_LIBRARY_PATH" ]; then
  for dir in $(echo $LD_LIBRARY_PATH | tr ":" "\n"); do
    if [ -f "$dir/libstdc++.so.6" ]; then
      echo "✅ Verified: $dir/libstdc++.so.6 exists"
      break
    fi
  done
fi

echo "🚀 Starting PersonaPlex server..."
/app/venv/bin/python -m moshi.server --ssl /tmp/ssl --host 0.0.0.0 --port $PORT --cpu-offload

