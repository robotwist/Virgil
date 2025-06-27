# 🚀 Deploy Virgil Coach in 15 Minutes

## Option 1: Netlify (Recommended - Easiest)

### Step 1: Deploy to Netlify
1. Go to [netlify.com](https://netlify.com) and sign up
2. Click "Add new site" → "Import an existing project"
3. Connect to GitHub and select your `Virgil` repository
4. Set build settings:
   - **Base directory**: `virgil-coach`
   - **Build command**: (leave empty)
   - **Publish directory**: `.` (current directory)
5. Click "Deploy site"

### Step 2: Get Custom Domain (Optional)
- In Netlify dashboard → Site settings → Domain management
- Buy domain or use free `.netlify.app` subdomain
- Suggested names: `virgilcoach.com`, `coachme.ai`, `interviewwins.com`

## Option 2: GitHub Pages (Free Alternative)

### Step 1: Enable GitHub Pages
1. Go to your GitHub repo → Settings → Pages
2. Source: Deploy from branch `main`
3. Folder: `/ (root)` but configure to serve `virgil-coach/` folder
4. Your PWA will be at: `https://robotwist.github.io/Virgil/virgil-coach/`

## Option 3: Vercel (Another Good Option)

1. Go to [vercel.com](https://vercel.com)
2. Import GitHub project
3. Set root directory to `virgil-coach`
4. Deploy automatically

## 🔧 Post-Deployment Checklist

### Test Core Functionality
- [ ] PWA installs correctly on mobile
- [ ] Microphone permissions work
- [ ] All 5 coaching modes function
- [ ] Speech synthesis works
- [ ] Hide interface works
- [ ] Emergency double-tap works

### Add Analytics (5 minutes)
1. Get Google Analytics tracking ID
2. Add to `index.html` head section:
```html
<!-- Google tag (gtag.js) -->
<script async src="https://www.googletagmanager.com/gtag/js?id=GA_TRACKING_ID"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'GA_TRACKING_ID');
</script>
```

### Share & Test
- [ ] Share URL with 3-5 friends for testing
- [ ] Test on different devices (iPhone, Android, Desktop)
- [ ] Get initial feedback on user experience

## 🎯 Go-Live Strategy

### Immediate Actions (Today)
1. **Deploy** (15 minutes)
2. **Test** with friends (30 minutes)
3. **Create** TikTok/Instagram accounts @VirgilCoach (10 minutes)
4. **Post** first success story on LinkedIn (20 minutes)

### Week 1 Actions
1. **Reddit posts** in r/jobs, r/interviews with helpful advice
2. **TikTok video**: "This app helped me nail my interview"
3. **Product Hunt preparation**: Gather early users for launch day support

### Quick Wins for User Acquisition
- **LinkedIn post**: "I built this tool to help with interview anxiety..." with demo video
- **Reddit strategy**: Be genuinely helpful first, then mention tool
- **Word of mouth**: Every user who succeeds should share the story

## 📱 PWA Installation Instructions (for users)

### On Mobile:
1. Open the website in browser
2. Look for "Add to Home Screen" prompt
3. Or: Browser menu → "Add to Home Screen"

### On Desktop:
1. Look for install icon (⊕) in address bar
2. Or: Browser menu → "Install [App Name]"

---

**Next Step**: Pick one deployment option above and let's get this live! The PWA is ready to go and could start getting users today.

Which deployment method would you prefer? Netlify is probably the easiest and most reliable for PWAs. 