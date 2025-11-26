# Knowledge Base Directory

Place your PDF and text files here for Dr. Snuggles to use as reference material.

## Supported Formats

- **PDF Files** (`.pdf`): Automatically parsed using pdf-parse
- **Text Files** (`.txt`): Plain text documents

## How It Works

1. On startup, all files in this directory are automatically loaded
2. Documents are parsed and chunked for optimal retrieval
3. Content is indexed using Orama vector search
4. The index is saved to `snuggles-index.json` for fast subsequent boots
5. During conversations, relevant knowledge is injected into Dr. Snuggles' context

## Example Files

Add your knowledge files here, for example:

- `molecular_biology_handbook.pdf`
- `esoteric_philosophy.txt`
- `chaos_theory_notes.pdf`
- `twitter_spaces_guidelines.txt`

## Tips

- **Chunk Size**: Large documents (>2000 words) are automatically split into smaller chunks
- **Relevance**: More focused documents lead to better RAG results
- **Updates**: Delete `snuggles-index.json` to force a re-index when you add new files
- **Performance**: Fewer, high-quality documents perform better than many low-quality ones

## Current Status

This directory is currently empty. Add your knowledge base files to get started!
