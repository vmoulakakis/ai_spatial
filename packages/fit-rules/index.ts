import {derive,type Scene,type Rect} from "../geometry-core/index.js";
export type FitStatus="FITS_VERIFIED"|"FITS_ESTIMATED"|"NEEDS_CONFIRMATION"|"DOES_NOT_FIT";
const overlap=(a:Rect,b:Rect)=>a.xM<b.xM+b.widthM&&a.xM+a.widthM>b.xM&&a.zM<b.zM+b.depthM&&a.zM+a.depthM>b.zM;
export function evaluateFit(scene:Scene) {
 const g=derive(scene),p=g.item,margin=p.clearanceM;
 const reasons:string[]=[];
 if(g.conflicts.length)reasons.push("Αντικρουόμενες επιβεβαιωμένες μετρήσεις.");
 if(!g.reference)reasons.push("Απαιτείται πραγματική αναφορά κλίμακας.");
 if(!p.confirmed)reasons.push("Οι διαστάσεις του αντικειμένου δεν έχουν επιβεβαιωθεί.");
 const clearances=[p.xM,p.zM,g.widthM-p.xM-p.widthM,g.depthM-p.zM-p.depthM];
 const minimumClearanceCm=Math.round(Math.min(...clearances)*1000)/10;
 if(clearances.some(v=>v+1e-8<margin))reasons.push("Ανεπαρκές περιθώριο από τοίχο.");
 const envelope={...p,xM:p.xM-margin,zM:p.zM-margin,widthM:p.widthM+2*margin,depthM:p.depthM+2*margin};
 for(const o of g.obstacles)if(overlap(envelope,o))reasons.push("Σύγκρουση με "+o.label+".");
 let status:FitStatus="FITS_ESTIMATED";
 if(g.conflicts.length||!g.reference||!p.confirmed)status="NEEDS_CONFIRMATION";
 else if(reasons.length)status="DOES_NOT_FIT";
 else reasons.push("Δεν έχουν ελεγχθεί ανοίγματα θυρών, διαδρομή μεταφοράς ή κανόνες ασφαλείας.");
 return {status,revision:g.revision,reasons,minimumClearanceCm};
}