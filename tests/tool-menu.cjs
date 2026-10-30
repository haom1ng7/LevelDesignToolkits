// Browser regressions use the same visible grouped-tool entry points as users.
async function openToolMenu(page,tool){
 const item=page.locator(`[data-tool="${tool}"]`);
 const trigger=await item.evaluate(el=>el.closest('.tool-group')?.querySelector('[data-tool-group]').id);
 if(trigger)await page.locator('#'+trigger).click();
 return item;
}
async function selectTool(page,tool){const item=await openToolMenu(page,tool);await item.click()}
module.exports={openToolMenu,selectTool};
