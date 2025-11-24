#!/bin/bash

# Usage: ./create-tag.sh <tag_name>
# Example: ./create-tag.sh v0.0.0-rc.1

TAG=$1

if [ -z "$TAG" ]; then
  echo "❌ Error: No tag specified."
  echo "Usage: ./create-tag.sh <tag_name>"
  exit 1
fi

# Check if tag already exists locally
if git rev-parse "$TAG" >/dev/null 2>&1; then
    echo "⚠️  Tag '$TAG' already exists locally."
    read -p "Do you want to delete it and recreate it? (y/N) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        git tag -d "$TAG"
    else
        echo "Aborting."
        exit 1
    fi
fi

echo "🏷️  Creating tag '$TAG'..."
if git tag "$TAG"; then
    echo "✅ Local tag created."
else
    echo "❌ Failed to create local tag."
    exit 1
fi

echo "🚀 Pushing tag to remote..."
if git push origin "$TAG"; then
    echo "✅ Remote tag pushed."
else
    echo "❌ Failed to push remote tag."
    exit 1
fi

echo "🎉 Done."
