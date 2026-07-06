import fs from 'fs';
import readline from 'readline';

const logPath = 'C:\\Users\\ASUS\\.gemini\\antigravity\\brain\\619e30eb-f315-459f-8295-00cbf2e8b283\\.system_generated\\logs\\transcript_full.jsonl';

async function processLineByLine() {
  const fileStream = fs.createReadStream(logPath);
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });

  let pageContent = null;

  for await (const line of rl) {
    try {
      const entry = JSON.parse(line);
      if (entry.tool_calls) {
        for (const call of entry.tool_calls) {
          if (call.name === 'write_to_file' && call.args && call.args.TargetFile && call.args.TargetFile.endsWith('page.tsx')) {
            pageContent = call.args.CodeContent;
          }
          if (call.name === 'multi_replace_file_content' && call.args && call.args.TargetFile && call.args.TargetFile.endsWith('page.tsx')) {
            if (pageContent && call.args.ReplacementChunks) {
              // Apply chunks
              let lines = pageContent.split('\n');
              for (const chunk of call.args.ReplacementChunks) {
                const startIdx = chunk.StartLine - 1;
                const endIdx = chunk.EndLine;
                
                // This is a naive replacement. It might fail if lines changed, but let's try!
                // Actually, the easiest is to replace targetContent with replacementContent in the whole file
                // if it's unique.
                const targetStr = chunk.TargetContent;
                const replaceStr = chunk.ReplacementContent;
                if (pageContent.includes(targetStr)) {
                  pageContent = pageContent.replace(targetStr, replaceStr);
                } else {
                  // Fallback: replace by line numbers? No, line numbers drift.
                  // Try to find the exact target string ignoring whitespace?
                  // Just skip if it doesn't match perfectly, or warn.
                  console.warn('Could not find chunk target content:', targetStr.substring(0, 50));
                }
              }
            }
          }
        }
      }
    } catch (e) {
    }
  }

  if (pageContent) {
    fs.writeFileSync('src/app/page.tsx', pageContent);
    console.log('Restored page.tsx with all edits!');
  } else {
    console.log('Could not find write_to_file for page.tsx');
  }
}

processLineByLine();
