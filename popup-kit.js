/*
  Dropshipping Popup Kit
  IMPORTANT: Do not invent purchases, stock levels, countdown deadlines, or visitor counts.
  Connect these values to your real store/backend before enabling social-proof messages.
*/
(function(){
  const cfg = window.DS_POPUP_CONFIG || {};
  const root = document.createElement('div');
  root.id = 'ds-popup-root';
  document.body.appendChild(root);

  const defaults = {
    enabled: ['welcome','support','shipping','coupon','cart','countdown','viewers','recent-order','stock','flash','happy','whatsapp','order-status','spin','newsletter'],
    interval: 9000,
    firstDelay: 2500,
    position: 'bottom-left',
    whatsappNumber: '', // e.g. 923001234567
    supportUrl: '#',
    productUrl: '#',
    couponCode: 'WELCOME10',
    offerEndsAt: '', // ISO date/time, e.g. 2026-12-31T23:59:00+05:00
    viewerCount: null, // set from a REAL analytics/API source
    recentOrder: null, // { customer: 'A customer', city: 'Karachi', product: 'Product name', minutesAgo: 4 } from real order data
    stockLeft: null, // real inventory number
    shippingThreshold: null,
    cartValue: null
  };
  const options = Object.assign({}, defaults, cfg);
  const all = {
    welcome: ['👋','Welcome to our store','Discover useful products at great prices. Enjoy your shopping!','purple'],
    support: ['💬','Need a hand?','Our customer support team is ready to help.',''],
    shipping: ['🚚','Free delivery available','Check your cart to see whether your order qualifies.','success'],
    coupon: ['🎁','A little welcome gift','Use code '+options.couponCode+' at checkout.','purple'],
    cart: ['🛍️','Still thinking it over?','Your selected items may still be waiting in your cart.',''],
    countdown: ['⏳','Offer ends soon','', 'warning'],
    viewers: ['👁️','People viewing this product','', 'dark'],
    'recent-order': ['🛒','Recent order','', 'success'],
    stock: ['🔥','Stock update','', 'warning'],
    flash: ['⚡','Special offer','Explore current deals while they are available.','purple'],
    happy: ['❤️','Thank you for shopping with us','We appreciate every customer.','success'],
    whatsapp: ['📱','Questions? Chat with us','Tap below to contact our team on WhatsApp.','success'],
    'order-status': ['📦','Order tracking','Your order has shipped? Track its latest status here.',''],
    spin: ['🎯','Unlock a special deal','Contact support to ask about current promotions.','purple'],
    newsletter: ['✉️','Stay in the loop','Follow our updates for new arrivals and offers.','']
  };

  function make(type){
    const data = all[type]; if(!data) return null;
    let title=data[1], body=data[2], icon=data[0], extra='';
    if(type==='viewers'){
      if(!Number.isFinite(Number(options.viewerCount))) return null;
      body = Number(options.viewerCount)+' people are viewing this product right now.';
    }
    if(type==='recent-order'){
      const o=options.recentOrder;
      if(!o || !o.customer || !o.product) return null;
      body = `${o.customer}${o.city?' from '+o.city:''} purchased ${o.product}${o.minutesAgo?' · '+o.minutesAgo+' min ago':''}.`;
    }
    if(type==='stock'){
      if(!Number.isFinite(Number(options.stockLeft))) return null;
      body = Number(options.stockLeft)+' items currently in stock.';
    }
    if(type==='countdown'){
      if(!options.offerEndsAt) return null;
      const end = new Date(options.offerEndsAt).getTime();
      if(!Number.isFinite(end) || end <= Date.now()) return null;
      const left=end-Date.now(), h=Math.floor(left/3600000), m=Math.floor(left%3600000/60000), s=Math.floor(left%60000/1000);
      body=`Offer ends in ${h}h ${m}m ${s}s.`;
    }
    if(type==='shipping' && Number.isFinite(Number(options.shippingThreshold)) && Number.isFinite(Number(options.cartValue))){
      const gap=Math.max(0,Number(options.shippingThreshold)-Number(options.cartValue));
      body=gap===0?'Your cart qualifies for free delivery!':'Add Rs. '+gap+' more to qualify for free delivery.';
    }
    if(type==='support') extra=`<a class="ds-cta" href="${safe(options.supportUrl)}">Contact support</a>`;
    if(type==='whatsapp'){
      if(!options.whatsappNumber) return null;
      extra=`<a class="ds-cta" target="_blank" rel="noopener" href="https://wa.me/${encodeURIComponent(options.whatsappNumber)}">Chat on WhatsApp</a>`;
    }
    if(type==='order-status') extra=`<a class="ds-cta" href="${safe(options.productUrl)}">Track order</a>`;
    if(type==='coupon') extra=`<span class="ds-small">Copy code: ${safe(options.couponCode)}</span>`;
    if(type==='stock') extra='<div class="ds-meter"><span></span></div>';
    const el=document.createElement('div');
    el.className='ds-pop '+data[3];
    el.innerHTML=`<div class="ds-icon">${icon}</div><div class="ds-copy"><strong>${safe(title)}</strong>${safe(body)}${extra}</div><button class="ds-close" aria-label="Close">×</button>`;
    el.querySelector('.ds-close').onclick=()=>el.remove();
    return el;
  }
  function safe(s){return String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
  let queue=options.enabled.filter(t=>all[t]);
  let index=0;
  function showNext(){
    if(!queue.length) return;
    for(let tries=0;tries<queue.length;tries++){
      const type=queue[index++%queue.length], el=make(type);
      if(el){root.appendChild(el);setTimeout(()=>{if(el.isConnected)el.remove()},6500);break;}
    }
  }
  setTimeout(()=>{showNext();setInterval(showNext,Math.max(6000,Number(options.interval)||9000));},Math.max(0,Number(options.firstDelay)||0));
})();
