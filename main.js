(function() {
    const mainContent = document.getElementById('mainContent');
    const newTabPage = document.getElementById('newTabPage');
    const projectsPage = document.getElementById('projectsPage');
    const assetsPage = document.getElementById('assetsPage');
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
    const assetsLink = document.getElementById('assetsLink');
    const languagesLink = document.getElementById('languagesLink');
    const friendsLink = document.getElementById('friendsLink');
    const linksLink = document.getElementById('linksLink');
    const blogLink = document.getElementById('blogLink');
    const darkToggle = document.getElementById('darkToggle');
    const sikeBox = document.getElementById('sikeBox');

    // BACKGROUND AUDIO PLAYER
    const bgAudio = document.getElementById('bg-audio');
    if (bgAudio) {
        bgAudio.volume = 0.4; // 40% volume
        bgAudio.loop = true;
        
        // Attempt to autoplay
        const playAudio = () => {
            bgAudio.play().catch(err => {
                console.log('Audio autoplay blocked. Waiting for user interaction...');
                // Will try again on first user click
            });
        };
        
        // Try to play immediately
        playAudio();
        
        // Also try on any user interaction if it was blocked
        document.addEventListener('click', function tryPlay() {
            if (bgAudio.paused) {
                bgAudio.play().catch(() => {});
            }
            document.removeEventListener('click', tryPlay);
        }, { once: true });
        
        // Also try on keydown
        document.addEventListener('keydown', function tryPlay() {
            if (bgAudio.paused) {
                bgAudio.play().catch(() => {});
            }
            document.removeEventListener('keydown', tryPlay);
        }, { once: true });
    }

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

    // Load Blog Posts
    async function loadBlogPosts() {
      try {
        blogLoading.classList.remove('hidden');
        blogError.classList.add('hidden');
        blogGrid.innerHTML = '';
        
        const response = await fetch('blog/rtx3090.json');
        if (!response.ok) throw new Error('Failed to fetch blog data');
        
        const posts = await response.json();
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
      assetsPage.classList.remove('active');
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
          else if (page === 'assets') { assetsPage.classList.add('active'); addressDisplay.textContent = 'Akumaware.one/assets'; updateTabLabel(tabId, 'Assets'); }
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
      assetsPage.classList.remove('active');
      languagesPage.classList.remove('active');
      friendsPage.classList.remove('active');
      linksPage.classList.remove('active');
      blogPage.classList.remove('active');

      if (page === 'meow') { newTabPage.classList.add('active'); addressDisplay.textContent = 'Akumaware.one/meow'; updateTabLabel(currentTabId, 'meow'); }
      else if (page === 'projects') { projectsPage.classList.add('active'); addressDisplay.textContent = 'Akumaware.one/projects'; updateTabLabel(currentTabId, 'Projects'); }
      else if (page === 'assets') { assetsPage.classList.add('active'); addressDisplay.textContent = 'Akumaware.one/assets'; updateTabLabel(currentTabId, 'Assets'); }
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
            assetsPage.classList.contains('active') ||
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
    assetsLink.addEventListener('click', function(e) { e.preventDefault(); showNewTabPage('assets'); });
    languagesLink.addEventListener('click', function(e) { e.preventDefault(); showNewTabPage('languages'); });
    friendsLink.addEventListener('click', function(e) { e.preventDefault(); showNewTabPage('friends'); });
    linksLink.addEventListener('click', function(e) { e.preventDefault(); showNewTabPage('links'); });
    blogLink.addEventListener('click', function(e) { e.preventDefault(); showNewTabPage('blog'); });

    switchTab('main');
  })();
