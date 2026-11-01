$env:PINECONE_API_KEY="pcsk_4xX2pT_LZRbk6mx8qFkF1Gc5c9e11gdt8N6hZAMc2gxgHCCYoDZRvRuvMdFbUKo8EnS5BX"
$env:PINECONE_INDEX_NAME="jarvis-knowledge"

.\.venv\Scripts\python.exe -m uvicorn backend.main:app --reload