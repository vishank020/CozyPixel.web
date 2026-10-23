// The theme pages' credit note can be dismissed. The choice is applied before first paint
// (like the theme, see lib/theme-dom.ts), so returning visitors never see it flash.

export const CREDIT_DISMISSED_KEY = "cozypixels-credit-dismissed";
export const CREDIT_DISMISSED_ATTR = "data-credit-dismissed";

export const creditNoteScript = `try{if(localStorage.getItem(${JSON.stringify(
  CREDIT_DISMISSED_KEY
)}))document.documentElement.setAttribute(${JSON.stringify(CREDIT_DISMISSED_ATTR)},"")}catch(e){}`;
