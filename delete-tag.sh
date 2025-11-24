#!/bin/bash

# Usage: ./delete-tag.sh <tag_name>
# Example: ./delete-tag.sh v0.0.0-rc.0

TAG=$1

if [ -z "$TAG" ]; then
  echo "❌ Error: No tag specified."
  echo "Usage: ./delete-tag.sh <tag_name>"
  exit 1
fi

echo "🗑️  Deleting tag '$TAG'..."

# Delete local tag
if git tag -d "$TAG" 2>/dev/null; then
    echo "✅ Local tag deleted."
else
    echo "⚠️  Local tag not found."
fi

# Delete remote tag
if git push --delete origin "$TAG" 2>/dev/null; then
    echo "✅ Remote tag deleted."
else
    echo "⚠️  Remote tag not found (or already deleted)."
fi

echo "🎉 Done."
