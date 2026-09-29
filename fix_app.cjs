const fs = require('fs');

let text = fs.readFileSync('src/App.tsx', 'utf8');

if (!text.includes('SpaceCanvas')) {
  text = text.replace(
    /import \{ DataBadge \} from '.\/components\/DataBadge'/,
    "import { DataBadge } from './components/DataBadge'\nimport { SpaceCanvas } from './components/SpaceCanvas'"
  );
  
  text = text.replace(
    /<div className="app-shell">/,
    "<div className=\"app-shell\">\n      <SpaceCanvas destination={destination} phase={activeScreen} />"
  );
}

text = text.replace(
  /const crisis = readOnly \? demoStep === 'crisis' \|\| demoStep === 'decision' : elapsed >= 2/,
  `const phases = ['Launch', 'Orbit', 'Transfer', 'Arrival', 'Operations', 'Science'];
  let currentPhaseIndex = Math.min(phases.length - 1, Math.floor(elapsed / 2)); 
  if (readOnly) {
     currentPhaseIndex = demoStep === 'crisis' || demoStep === 'decision' ? 4 : 2;
  }
  const currentPhase = phases[currentPhaseIndex];
  const crisis = readOnly ? demoStep === 'crisis' || demoStep === 'decision' : (currentPhase === 'Operations' || currentPhase === 'Launch');`
);

text = text.replace(
  /Segment 04 \/ Science operations/, 
  "Phase 04 / ${currentPhase}"
);
text = text.replace(
  /'Segment 03 \/ Transfer cruise'/, 
  "`Phase 03 / ${currentPhase}`"
);

text = text.replace(
  /<h2>\{crisis \? event.title : 'Mission systems nominal\.'\}<\/h2>/,
  "<h2>{crisis ? event.title : `${currentPhase} systems nominal`}</h2>"
);

fs.writeFileSync('src/App.tsx', text);
