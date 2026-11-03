// Normalize persisted component labels after structural openings are restored.
(()=>{
'use strict';const M=window.StudioModel,validate=M.validate;
M.validate=input=>{const p=validate(input);for(const d of p.documents)M.normalizeComponentNames(d);return p};
})();
