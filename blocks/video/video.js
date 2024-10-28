const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

function embedYoutube(url, autoplay, background) {
  const usp = new URLSearchParams(url.search);
  let suffix = '';
  if (background || autoplay) {
    const suffixParams = {
      autoplay: autoplay ? '1' : '0',
      mute: background ? '1' : '0',
      controls: background ? '0' : '1',
      disablekb: background ? '1' : '0',
      loop: background ? '1' : '0',
      playsinline: background ? '1' : '0',
    };
    suffix = `&${Object.entries(suffixParams).map(([k, v]) => `${k}=${encodeURIComponent(v)}`).join('&')}`;
  }
  let vid = usp.get('v') ? encodeURIComponent(usp.get('v')) : '';
  const embed = url.pathname;
  if (url.origin.includes('youtu.be')) {
    [, vid] = url.pathname.split('/');
  }

  const temp = document.createElement('div');
  temp.innerHTML = `<div style="left: 0; width: 100%; height: 0; position: relative; padding-bottom: 56.25%;">
      <iframe src="https://www.youtube.com${vid ? `/embed/${vid}?rel=0&v=${vid}${suffix}` : embed}" style="border: 0; top: 0; left: 0; width: 100%; height: 100%; position: absolute;" 
      allow="autoplay; fullscreen; picture-in-picture; encrypted-media; accelerometer; gyroscope; picture-in-picture" allowfullscreen="" scrolling="no" title="Content from Youtube" loading="lazy"></iframe>
    </div>`;
  return temp.children.item(0);
}

function embedVimeo(url, autoplay, background) {
  const [, video] = url.pathname.split('/');
  let suffix = '';
  if (background || autoplay) {
    const suffixParams = {
      autoplay: autoplay ? '1' : '0',
      background: background ? '1' : '0',
    };
    suffix = `?${Object.entries(suffixParams).map(([k, v]) => `${k}=${encodeURIComponent(v)}`).join('&')}`;
  }
  const temp = document.createElement('div');
  temp.innerHTML = `<div style="left: 0; width: 100%; height: 0; position: relative; padding-bottom: 56.25%;">
      <iframe src="https://player.vimeo.com/video/${video}${suffix}" 
      style="border: 0; top: 0; left: 0; width: 100%; height: 100%; position: absolute;" 
      frameborder="0" allow="autoplay; fullscreen; picture-in-picture" allowfullscreen  
      title="Content from Vimeo" loading="lazy"></iframe>
    </div>`;
  return temp.children.item(0);
}

function getVideoElement(source, autoplay, background, timeRange) {
  const video = document.createElement('video');
  video.setAttribute('controls', '');
  if (autoplay) video.setAttribute('autoplay', '');
  
  // Set up background video properties
  if (background) {
    video.setAttribute('loop', '');
    video.setAttribute('playsinline', '');
    video.removeAttribute('controls');
    video.addEventListener('canplay', () => {
      video.muted = true;
      if (autoplay) video.play();
    });
  }

  // Create the hotspot element
  const hotspotContainer = document.createElement('div');
  hotspotContainer.classList.add('hotspot-container');

  // Create the html element
  const modalContainer = document.createElement('div');
  modalContainer.classList.add('modal-container');

  const revealButton = document.createElement('button');
  revealButton.setAttribute('id','revealButton');
  revealButton.setAttribute('style','display:none;');
  revealButton.innerHTML=`Show Referral Code`;

let timePositionData = {};
let activeButtons = new Set();
let idSet = new Set();

// Fetch JSON from URL
fetch("http://localhost:3000/hotspot.json")
  .then(response => response.json())
  .then(data => {
    timePositionData = data.data; // Store the fetched JSON data in timePositionData
    console.log("Data loaded:", timePositionData); // Optional: Log the data to verify
  })
  .catch(error => {
    console.error("Error fetching data:", error);
  });

  function showButtonAtPosition(item) {
    const positions = item.Position.split(',');
    const image = item.image;
    for(let position of positions)
    {
      const id = `${item.Time}/${position}`;
      if(!idSet.has(id))
      {
        const hotspotButton = document.createElement('button');
        hotspotButton.classList.add('shopping-button');
        hotspotButton.dataset.id = id;
        const shopIcon = document.createElement('i');
        shopIcon.classList.add('fas', 'fa-shopping-bag');
        hotspotButton.appendChild(shopIcon);
        hotspotContainer.appendChild(hotspotButton);

        const positionValues = position.split(';');
        for(const position of positionValues)
        {
          const [property, value] = position.split(":");
          hotspotButton.style[property.trim()] = value.trim();
          console.log(`Showing button at ${value} from ${property}`);
        }
        activeButtons.add(hotspotButton);
        idSet.add(id);

        // Display the modal and pause the video
        const modal = document.createElement('div');
        modal.classList.add('modal');
        modal.setAttribute('id','productModal');
        modal.dataset.id = `modal-${id}`;
        modal.innerHTML = `<div class="modal-content" style="top: 15%; left: 30%;">
          <div class="modal-left">
            <img src="https://main--eds--godsofheaven.aem.page/assets/media_18b0792fc3c73bf03959982a57d12507bc56093a9.jpeg" alt="Product Image">
          </div>
          <div class="modal-right">
            <p class="product-text"> Modular Bed Architecture Set: Limited Time Sale</p>
            <h2> $150 </h2>
            <button class="modal-button add-to-cart" onclick="cartAdd(this)">Add to Cart</button>
            <button class="modal-button buy-now">Buy Now</button>
          </div>
          <span class="close">&times;</span>
          </div>
          `;
        modal.querySelector('img').setAttribute('src',item.Image);
        modal.querySelector('.product-text').innerHTML = item.Description;
        modal.querySelector('h2').innerHTML = item.Price;
        modalContainer.appendChild(modal);
      }
    }
  }

  function cartAdd(e){
    e.innerHTML = `Added to cart`;
  }
  
  // Function to hide the button
  function hideButton(currentTime) {
    const activeButtonElements = hotspotContainer.querySelectorAll(".shopping-button");

    activeButtonElements.forEach((button) => {
      const id = button.dataset.id;
      const timeRange = id.split('/')[0].split('-');
      if (timeRange && (currentTime < timeRange[0] || currentTime > timeRange[1])) {
        button.remove(); // Remove button from DOM
        activeButtons.delete(button);
        idSet.delete(id); // Remove from active tracking
      }
    });
  }
  let referralAdded = false;
  // Add logic to show the form starting at the specified startTime
  video.addEventListener("timeupdate", () => {
    const currentTime = video.currentTime;
    hideButton(currentTime);
    // Hide button initially
    let buttonVisible = false;
    if (currentTime >= timeRange[0] && currentTime <= timeRange[1]) {
      revealButton.setAttribute('style','display:block');
      referralAdded = true;
    }
    else{
      revealButton.setAttribute('style','display:none');
    }
  
    // Loop through the time ranges in the JSON
    for (const item of timePositionData) {
      const [start, end] = item.Time.split("-").map(Number);
      
      if (currentTime >= start && currentTime <= end) {
        const positions = item.Position.split(',');
        // Show the button at specified position and set the image
        showButtonAtPosition(item);
        buttonVisible = true;
        break;
      }
    }
  
    // If no time range matches, hide the button
    if (!buttonVisible) hideButton();
  });

  // Add form submission handler
  hotspotContainer.addEventListener("click", (e) => {
    // Check if the clicked element has the 'shopping-button' class
    if (e.target.classList.contains("shopping-button")) {
      e.preventDefault();
      const id = e.target.dataset.id;
      video.pause();
      const activeModals = modalContainer.querySelectorAll('.modal');
      activeModals.forEach((modal) =>{
        const buttonId = modal.dataset.id.replace(/^modal-/, "");
        if(buttonId === id)
        {
          modal.style.display = 'block';
        }
      })
    }
  });

  modalContainer.addEventListener("click", (e) => {
    // Check if the clicked element has the 'productModal' id
    if (e.target.classList.contains("close")) {
      e.preventDefault();
      e.target.parentElement.parentElement.style.display = 'none';
      video.play();
    }
  });

  revealButton.addEventListener("click", (e) => {
    revealButton.innerHTML=`<span id="code">ABC123XYZ</span>
    <i class="fa-solid fa-copy"></i>`;
  });

  // Create and append video source
  const sourceEl = document.createElement('source');
  sourceEl.setAttribute('src', source);
  sourceEl.setAttribute('type', `video/${source.split('.').pop()}`);
  video.append(sourceEl);

  // Wrap the video and hotspot in a container to position form over video
  const container = document.createElement('div');
  container.style.position = 'relative';
  container.append(video, hotspotContainer);
  container.append(hotspotContainer, modalContainer);
  container.append(modalContainer, revealButton);
  return container;
}

const loadVideoEmbed = (block, link, autoplay, background, timeRange) => {
  if (block.dataset.embedLoaded === 'true') {
    return;
  }
  const url = new URL(link);

  const isYoutube = link.includes('youtube') || link.includes('youtu.be');
  const isVimeo = link.includes('vimeo');

  if (isYoutube) {
    const embedWrapper = embedYoutube(url, autoplay, background);
    block.append(embedWrapper);
    embedWrapper.querySelector('iframe').addEventListener('load', () => {
      block.dataset.embedLoaded = true;
    });
  } else if (isVimeo) {
    const embedWrapper = embedVimeo(url, autoplay, background);
    block.append(embedWrapper);
    embedWrapper.querySelector('iframe').addEventListener('load', () => {
      block.dataset.embedLoaded = true;
    });
  } else {
    const videoEl = getVideoElement(link, autoplay, background, timeRange);
    block.append(videoEl);
    videoEl.addEventListener('canplay', () => {
      block.dataset.embedLoaded = true;
    });
  }
};

export default async function decorate(block) {
  const fontAwesome = document.createElement("link");
  fontAwesome.rel = "stylesheet";
  fontAwesome.href = "https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css";
  document.head.appendChild(fontAwesome);
  const placeholder = block.querySelector('picture');
  const link = block.querySelector('a').href;
  const timeRange = block.querySelectorAll('p')[1].innerHTML.split('-')
  block.textContent = '';
  block.dataset.embedLoaded = false;

  const autoplay = block.classList.contains('autoplay');
  if (placeholder) {
    block.classList.add('placeholder');
    const wrapper = document.createElement('div');
    wrapper.className = 'video-placeholder';
    wrapper.append(placeholder);

    if (!autoplay) {
      wrapper.insertAdjacentHTML(
        'beforeend',
        '<div class="video-placeholder-play"><button type="button" title="Play"></button></div>',
      );
      wrapper.addEventListener('click', () => {
        wrapper.remove();
        loadVideoEmbed(block, link, true, false, timeRange);
      });
    }
    block.append(wrapper);
  }

  if (!placeholder || autoplay) {
    const observer = new IntersectionObserver((entries) => {
      if (entries.some((e) => e.isIntersecting)) {
        observer.disconnect();
        const playOnLoad = autoplay && !prefersReducedMotion.matches;
        loadVideoEmbed(block, link, playOnLoad, autoplay, timeRange);
      }
    });
    observer.observe(block);
  }
}