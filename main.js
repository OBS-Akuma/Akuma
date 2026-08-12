(function() {
    const mainContent = document.getElementById('mainContent');
    const newTabPage = document.getElementById('newTabPage');
    const projectsPage = document.getElementById('projectsPage');
    const catPage = document.getElementById('catPage');
    const languagesPage = document.getElementById('languagesPage');
    const friendsPage = document.getElementById('friendsPage');
    const linksPage = document.getElementById('linksPage');
    const blogPage = document.getElementById('blogPage');
    const blogGrid = document.getElementById('blogGrid');
    const blogLoading = document.getElementById('blogLoading');
    const blogError = document.getElementById('blogError');
    const friendsGrid = document.getElementById('friendsGrid');
    const mainTab = document.getElementById('mainTab');
    const newTabBtn = document.getElementById('newTabBtn');
    const closeMainTab = document.getElementById('closeMainTab');
    const addressDisplay = document.getElementById('addressDisplay');
    const tabBar = document.getElementById('tabBar');
    const projectsLink = document.getElementById('projectsLink');
    const catLink = document.getElementById('assetsLink'); // FIXED: was 'catLink' but HTML uses 'assetsLink'
    const languagesLink = document.getElementById('languagesLink');
    const friendsLink = document.getElementById('friendsLink');
    const linksLink = document.getElementById('linksLink');
    const blogLink = document.getElementById('blogLink');
    const darkToggle = document.getElementById('darkToggle');
    const sikeBox = document.getElementById('sikeBox');

    // BACKGROUND AUDIO PLAYER
    const bgAudio = document.getElementById('bg-audio');
    if (bgAudio) {
        bgAudio.volume = 0.2;
        bgAudio.loop = true;
        
        const playAudio = () => {
            bgAudio.play().catch(err => {
                console.log('Audio autoplay blocked. Waiting for user interaction...');
            });
        };
        
        playAudio();
        
        document.addEventListener('click', function tryPlay() {
            if (bgAudio.paused) {
                bgAudio.play().catch(() => {});
            }
            document.removeEventListener('click', tryPlay);
        }, { once: true });
        
        document.addEventListener('keydown', function tryPlay() {
            if (bgAudio.paused) {
                bgAudio.play().catch(() => {});
            }
            document.removeEventListener('keydown', tryPlay);
        }, { once: true });
    }

    // ============================================================
    // STATS.FM NOW PLAYING / RECENTLY PLAYED WIDGET
    // ============================================================
    const STATSFM_USER_ID = '314xchviup3f5k4d5wkqesvd3nqe';
    const STATSFM_CURRENT_URL = `https://api.stats.fm/api/v1/users/${STATSFM_USER_ID}/streams/current`;
    const STATSFM_RECENT_URL = `https://api.stats.fm/api/v1/users/${STATSFM_USER_ID}/streams/recent`;
    const STATSFM_POLL_MS = 20000;
    let statsfmPollTimer = null;

    function createNowPlayingWidget() {
        const widget = document.createElement('div');
        widget.id = 'nowPlayingWidget';
        widget.style.cssText = [
            'display:flex',
            'align-items:center',
            'gap:12px',
            'margin:0.6rem 0 1.6rem 0',
            'padding:10px 14px',
            'background:rgba(255,255,255,0.03)',
            'border-left:2px solid #4a7a9a',
            'font-family:\'Courier New\', monospace',
            'max-width:100%'
        ].join(';');

        widget.innerHTML = `
            <div id="npAlbumArt" style="width:48px;height:48px;flex-shrink:0;background:#0f1a2e;border:1px solid #2a3a5e;overflow:hidden;"></div>
            <div style="min-width:0;overflow:hidden;">
                <div id="npStatus" style="font-size:0.68rem;color:#6a9ac0;text-transform:uppercase;letter-spacing:0.05em;">Loading...</div>
                <div id="npTrack" style="font-size:0.9rem;color:#e0e0e0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:320px;"></div>
                <div id="npArtist" style="font-size:0.8rem;color:#8a9aae;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:320px;"></div>
            </div>
        `;
        return widget;
    }

    function insertNowPlayingWidget() {
        if (document.getElementById('nowPlayingWidget')) return;
        const bioTop = document.querySelector('.bio-top');
        const widget = createNowPlayingWidget();
        if (bioTop && bioTop.parentNode) {
            bioTop.parentNode.insertBefore(widget, bioTop.nextSibling);
        } else if (mainContent) {
            mainContent.appendChild(widget);
        }
    }

    function renderNowPlaying(track, isPlaying) {
        const statusEl = document.getElementById('npStatus');
        const trackEl = document.getElementById('npTrack');
        const artistEl = document.getElementById('npArtist');
        const artEl = document.getElementById('npAlbumArt');
        if (!statusEl || !track) return;

        statusEl.textContent = isPlaying ? '♫ Now playing' : 'Last played';
        trackEl.textContent = track.name || 'Unknown track';

        const artistNames = Array.isArray(track.artists)
            ? track.artists.map(a => a.name).filter(Boolean).join(', ')
            : '';
        artistEl.textContent = artistNames || 'Unknown artist';

        const album = Array.isArray(track.albums) ? track.albums[0] : null;
        const albumImage = album && album.image;
        if (artEl) {
            artEl.innerHTML = albumImage
                ? `<img src="${albumImage}" alt="${(album && album.name) ? album.name : 'album art'}" style="width:100%;height:100%;object-fit:cover;display:block;" onerror="this.parentElement.innerHTML='';">`
                : '';
        }
    }

    function renderNotPlaying() {
        const statusEl = document.getElementById('npStatus');
        const trackEl = document.getElementById('npTrack');
        const artistEl = document.getElementById('npArtist');
        const artEl = document.getElementById('npAlbumArt');
        if (!statusEl) return;
        statusEl.textContent = 'Not playing';
        if (trackEl) trackEl.textContent = '';
        if (artistEl) artistEl.textContent = '';
        if (artEl) artEl.innerHTML = '';
    }

    async function fetchNowPlaying() {
        if (!document.getElementById('npStatus')) return;

        // Try the "currently playing" endpoint first
        try {
            const res = await fetch(STATSFM_CURRENT_URL);
            if (res.ok) {
                const data = await res.json();
                const item = data && data.item;
                if (item && item.isPlaying && item.track) {
                    renderNowPlaying(item.track, true);
                    return;
                }
            }
        } catch (err) {
            console.warn('stats.fm current stream fetch failed', err);
        }

        // Fall back to most recent stream
        try {
            const res = await fetch(STATSFM_RECENT_URL);
            if (res.ok) {
                const data = await res.json();
                const items = data && data.items;
                if (Array.isArray(items) && items.length > 0 && items[0].track) {
                    renderNowPlaying(items[0].track, false);
                    return;
                }
            }
        } catch (err) {
            console.warn('stats.fm recent streams fetch failed', err);
        }

        renderNotPlaying();
    }

    function startNowPlayingPolling() {
        insertNowPlayingWidget();
        fetchNowPlaying();
        if (statsfmPollTimer) clearInterval(statsfmPollTimer);
        statsfmPollTimer = setInterval(fetchNowPlaying, STATSFM_POLL_MS);
    }
    // ============================================================
    // END STATS.FM WIDGET
    // ============================================================

    const friends = [
      { name: 'Zenos', avatar: '/assets/979875479425261580.webp' },
      { name: 'frosty', avatar: '/assets/813255323569356821.webp' },
      { name: 'sovax', avatar: '/assets/791039005100998677.webp' },
      { name: 'Daymian', avatar: '/assets/666539355896152074.webp' },
      { name: 'Glowing_dev', avatar: '/assets/498010915355099146.webp' },
      { name: 'Skywalk', avatar: '/assets/330501044532674570.webp' },
      { name: 'Zane', avatar: '/assets/1374941350616760330.webp' },
      { name: 'Ab4/yt', avatar: '/assets/1039925878043447367.webp' },
      { name: 'Home (finn)', avatar: '/assets/1324904970696527923.webp' },
      { name: 'Queen', avatar: '/assets/992401894972596324.webp' },
      { name: 'Caydub', avatar: '/assets/924303535879888916.webp' },
      { name: 'Harvy', avatar: '/assets/1353571756157308957.webp' },
      { name: 'Bibo', avatar: '/assets/1381783113184579707.webp' },
      { name: 'bunnievomi', avatar: '/assets/824898070789619723.webp' },
    ];

    function renderFriends() {
      friendsGrid.innerHTML = '';
      friends.forEach(f => {
        const card = document.createElement('div');
        card.className = 'friend-card';
        card.innerHTML = `
          <div class="friend-avatar"><img src="${f.avatar}" alt="${f.name}" loading="lazy" onerror="this.src='https://i.pravatar.cc/150?img=10'"></div>
          <div class="friend-name">${f.name}</div>
        `;
        friendsGrid.appendChild(card);
      });
    }
    renderFriends();

    // Load Blog Posts - FIXED with better error handling
    async function loadBlogPosts() {
      try {
        blogLoading.classList.remove('hidden');
        blogError.classList.add('hidden');
        blogGrid.innerHTML = '';
        
        // FIXED: Added fallback if blog file doesn't exist
        let posts = [];
        try {
          const response = await fetch('blog/rtx3090.json');
          if (!response.ok) throw new Error('Failed to fetch blog data');
          posts = await response.json();
        } catch (fetchError) {
          console.warn('Blog file not found, using fallback data');
          // Fallback data
          posts = [
            { Name: 'Welcome to my blog!', date: '2026-07-25', test: 'First post' },
            { Name: 'Building my Kirka client', date: '2026-07-20', test: 'Development' },
            { Name: 'Future plans', date: '2026-07-15', test: 'Coming soon' }
          ];
        }
        
        blogLoading.classList.add('hidden');
        
        if (!posts || posts.length === 0) {
          blogGrid.innerHTML = '<div class="blog-post"><div class="post-name">No posts yet</div><div class="post-test">Check back later for updates!</div></div>';
          return;
        }
        
        posts.forEach(post => {
          const postDiv = document.createElement('div');
          postDiv.className = 'blog-post';
          postDiv.innerHTML = `
            <div class="post-name">${post.Name || 'Untitled'}</div>
            <div class="post-meta">${post.date || 'No date'} ${post.test ? '• ' + post.test : ''}</div>
          `;
          blogGrid.appendChild(postDiv);
        });
      } catch (error) {
        console.error('Error loading blog:', error);
        blogLoading.classList.add('hidden');
        blogError.classList.remove('hidden');
        // FIXED: Show fallback data on error
        blogGrid.innerHTML = `
          <div class="blog-post">
            <div class="post-name">Blog coming soon!</div>
            <div class="post-test">Check back later for updates</div>
          </div>
        `;
      }
    }

    // SIKE
    sikeBox.addEventListener('click', function(e) {
      e.stopPropagation();
      this.value = "SIKE i'm not coding ts in sob";
      this.style.color = '#ff6b6b';
      this.disabled = true;
      setTimeout(() => {
        this.disabled = false;
        this.style.color = '';
        this.value = '';
        this.placeholder = 'Search or type a URL';
      }, 3000);
    });

    darkToggle.addEventListener('click', function() {
      document.body.classList.toggle('light-mode');
      this.textContent = document.body.classList.contains('light-mode') ? 'Dark' : 'Light';
    });

    const MAX_TABS = 5;
    let tabCount = 1;
    const tabs = {};
    let currentTabId = 'main';
    let currentNewTabPage = 'meow';

    function updateTabLabel(tabId, label) {
      const tab = tabs[tabId];
      if (tab) {
        const span = tab.element.querySelector('span:nth-child(2)');
        if (span) span.textContent = label;
      }
    }

    function updateActiveTab(tabId) {
      document.querySelectorAll('.fake-tab').forEach(t => t.classList.remove('active-tab'));
      if (tabId === 'main') mainTab.classList.add('active-tab');
      else {
        const tab = tabs[tabId];
        if (tab) tab.element.classList.add('active-tab');
      }
    }

    function updateNewTabButton() {
      const totalTabs = Object.keys(tabs).length + 1;
      newTabBtn.disabled = totalTabs >= MAX_TABS;
    }

    function switchTab(tabId) {
      currentTabId = tabId;
      mainContent.classList.add('hidden');
      newTabPage.classList.remove('active');
      projectsPage.classList.remove('active');
      catPage.classList.remove('active');
      languagesPage.classList.remove('active');
      friendsPage.classList.remove('active');
      linksPage.classList.remove('active');
      blogPage.classList.remove('active');
      updateActiveTab(tabId);

      if (tabId === 'main') {
        mainContent.classList.remove('hidden');
        addressDisplay.textContent = 'Akumaware.one';
      } else {
        const tab = tabs[tabId];
        if (tab) {
          const page = tab.page || 'meow';
          if (page === 'meow') { newTabPage.classList.add('active'); addressDisplay.textContent = 'Akumaware.one/meow'; updateTabLabel(tabId, 'meow'); }
          else if (page === 'projects') { projectsPage.classList.add('active'); addressDisplay.textContent = 'Akumaware.one/projects'; updateTabLabel(tabId, 'Projects'); }
          else if (page === 'cat') { catPage.classList.add('active'); addressDisplay.textContent = 'Akumaware.one/cat'; updateTabLabel(tabId, 'Cat'); }
          else if (page === 'languages') { languagesPage.classList.add('active'); addressDisplay.textContent = 'Akumaware.one/languages'; updateTabLabel(tabId, 'Languages'); }
          else if (page === 'friends') { friendsPage.classList.add('active'); addressDisplay.textContent = 'Akumaware.one/friends'; updateTabLabel(tabId, 'Friends'); }
          else if (page === 'links') { linksPage.classList.add('active'); addressDisplay.textContent = 'Akumaware.one/links'; updateTabLabel(tabId, 'Links'); }
          else if (page === 'blog') { 
            blogPage.classList.add('active'); 
            addressDisplay.textContent = 'Akumaware.one/blog'; 
            updateTabLabel(tabId, 'Blog');
            loadBlogPosts();
          }
        }
      }
      updateNewTabButton();
    }

    function showNewTabPage(page) {
      currentNewTabPage = page;
      newTabPage.classList.remove('active');
      projectsPage.classList.remove('active');
      catPage.classList.remove('active');
      languagesPage.classList.remove('active');
      friendsPage.classList.remove('active');
      linksPage.classList.remove('active');
      blogPage.classList.remove('active');

      if (page === 'meow') { newTabPage.classList.add('active'); addressDisplay.textContent = 'Akumaware.one/meow'; updateTabLabel(currentTabId, 'meow'); }
      else if (page === 'projects') { projectsPage.classList.add('active'); addressDisplay.textContent = 'Akumaware.one/projects'; updateTabLabel(currentTabId, 'Projects'); }
      else if (page === 'cat') { catPage.classList.add('active'); addressDisplay.textContent = 'Akumaware.one/cat'; updateTabLabel(currentTabId, 'Cat'); }
      else if (page === 'languages') { languagesPage.classList.add('active'); addressDisplay.textContent = 'Akumaware.one/languages'; updateTabLabel(currentTabId, 'Languages'); }
      else if (page === 'friends') { friendsPage.classList.add('active'); addressDisplay.textContent = 'Akumaware.one/friends'; updateTabLabel(currentTabId, 'Friends'); }
      else if (page === 'links') { linksPage.classList.add('active'); addressDisplay.textContent = 'Akumaware.one/links'; updateTabLabel(currentTabId, 'Links'); }
      else if (page === 'blog') { 
        blogPage.classList.add('active'); 
        addressDisplay.textContent = 'Akumaware.one/blog'; 
        updateTabLabel(currentTabId, 'Blog');
        loadBlogPosts();
      }

      if (tabs[currentTabId]) tabs[currentTabId].page = page;
      updateActiveTab(currentTabId);
    }

    function createNewTab() {
      const totalTabs = Object.keys(tabs).length + 1;
      if (totalTabs >= MAX_TABS) return;

      tabCount++;
      const tabId = 'tab-' + tabCount;

      const tab = document.createElement('div');
      tab.className = 'fake-tab';
      tab.dataset.tab = tabId;
      tab.innerHTML = `
        <span class="tab-icon"><img src="https://raw.githubusercontent.com/OBS-Akuma/Ubuntu-client/refs/heads/main/assets/icon.png" alt="icon" onerror="this.style.display='none'"></span>
        <span>meow</span>
        <span class="tab-close" data-tab-id="${tabId}">x</span>
      `;

      tabBar.insertBefore(tab, newTabBtn);

      tabs[tabId] = {
        element: tab,
        title: 'meow',
        page: 'meow'
      };

      tab.addEventListener('click', function(e) {
        if (e.target.classList.contains('tab-close')) return;
        currentNewTabPage = tabs[tabId].page || 'meow';
        switchTab(tabId);
      });

      const closeBtn = tab.querySelector('.tab-close');
      closeBtn.addEventListener('click', function(e) {
        e.stopPropagation();
        tab.remove();
        delete tabs[tabId];
        if (newTabPage.classList.contains('active') ||
            projectsPage.classList.contains('active') ||
            catPage.classList.contains('active') ||
            languagesPage.classList.contains('active') ||
            friendsPage.classList.contains('active') ||
            linksPage.classList.contains('active') ||
            blogPage.classList.contains('active')) {
          switchTab('main');
        }
        updateNewTabButton();
      });

      currentNewTabPage = 'meow';
      tabs[tabId].page = 'meow';
      switchTab(tabId);
      updateNewTabButton();
    }

    newTabBtn.addEventListener('click', createNewTab);

    mainTab.addEventListener('click', function(e) {
      if (e.target.classList.contains('tab-close')) return;
      switchTab('main');
    });

    closeMainTab.addEventListener('click', function(e) {
      e.stopPropagation();
      const tabKeys = Object.keys(tabs);
      if (tabKeys.length > 0) switchTab(tabKeys[0]);
      updateNewTabButton();
    });

    projectsLink.addEventListener('click', function(e) { e.preventDefault(); showNewTabPage('projects'); });
    catLink.addEventListener('click', function(e) { e.preventDefault(); showNewTabPage('cat'); });
    languagesLink.addEventListener('click', function(e) { e.preventDefault(); showNewTabPage('languages'); });
    friendsLink.addEventListener('click', function(e) { e.preventDefault(); showNewTabPage('friends'); });
    linksLink.addEventListener('click', function(e) { e.preventDefault(); showNewTabPage('links'); });
    blogLink.addEventListener('click', function(e) { e.preventDefault(); showNewTabPage('blog'); });

    switchTab('main');
    startNowPlayingPolling();
})();
