let score = 0;
let level = 1;
let xp = 0;
let combo = 1;
let lastClickTime = 0;
let comboTimeout;
let gameContainer;
let clickPower = 1;
let autoClickerInterval;
let sosisSize = 100;
let goldenChance = 0.05;
let timeSlowFactor = 1;
let spawnInterval;
let soundEnabled = true;
let animationSpeed = 1;
let spawnRate = 2000;

// Ses efektleri
const sounds = {
    pop: new Audio('sounds/pop.mp3'),
    levelUp: new Audio('sounds/levelup.mp3'),
    achievement: new Audio('sounds/achievement.mp3'),
    click: new Audio('sounds/click.mp3'),
    golden: new Audio('sounds/golden.mp3')
};

// Seslerin başlangıç ayarları
Object.values(sounds).forEach(sound => {
    sound.volume = 0.3;
});

function playSound(soundName) {
    if (soundEnabled && sounds[soundName]) {
        sounds[soundName].currentTime = 0;
        sounds[soundName].play().catch(err => console.log('Sound play failed:', err));
    }
}

// Ayarlar
document.getElementById('sound-toggle').addEventListener('change', function(e) {
    soundEnabled = e.target.checked;
});

document.getElementById('animation-speed').addEventListener('input', function(e) {
    animationSpeed = e.target.value;
    document.documentElement.style.setProperty('--animation-speed', animationSpeed);
});

document.getElementById('spawn-rate').addEventListener('input', function(e) {
    // Değeri tersine çeviriyoruz (3000 - value), böylece kaydırıcı sağa gittikçe hızlanacak
    spawnRate = 3000 - parseInt(e.target.value);
    if (spawnInterval) {
        clearInterval(spawnInterval);
        spawnInterval = setInterval(spawnSosis, spawnRate);
    }
});

function toggleShop() {
    const shop = document.getElementById('shop-container');
    const achievements = document.getElementById('achievements-container');
    const settings = document.getElementById('settings-container');
    
    achievements.style.display = 'none';
    settings.style.display = 'none';
    shop.style.display = shop.style.display === 'none' ? 'block' : 'none';
}

function toggleAchievements() {
    const shop = document.getElementById('shop-container');
    const achievements = document.getElementById('achievements-container');
    const settings = document.getElementById('settings-container');
    
    shop.style.display = 'none';
    settings.style.display = 'none';
    achievements.style.display = achievements.style.display === 'none' ? 'block' : 'none';
}

function toggleSettings() {
    const shop = document.getElementById('shop-container');
    const achievements = document.getElementById('achievements-container');
    const settings = document.getElementById('settings-container');
    
    shop.style.display = 'none';
    achievements.style.display = 'none';
    settings.style.display = settings.style.display === 'none' ? 'block' : 'none';
}

let achievements = {
    clickMaster: { name: "Tıklama Ustası", description: "1000 puan kazan", requirement: 1000, unlocked: false },
    comboKing: { name: "Combo Kralı", description: "10x combo yap", requirement: 10, unlocked: false },
    levelUp: { name: "Seviye Atlama", description: "5. seviyeye ulaş", requirement: 5, unlocked: false },
    goldenHunter: { name: "Altın Avcısı", description: "5 altın sosis yakala", requirement: 5, unlocked: false },
    speedDemon: { name: "Hız Şeytanı", description: "1 saniyede 3 sosis yakala", requirement: 3, unlocked: false }
};

let upgrades = {
    click_power: { price: 100, owned: false },
    auto_click: { price: 200, owned: false },
    sosis_size: { price: 150, owned: false },
    golden_sosis: { price: 300, owned: false },
    combo_master: { price: 250, owned: false },
    time_slow: { price: 180, owned: false }
};

function spawnSosis() {
    if (!gameContainer) return;
    
    const sosis = document.createElement('img');
    sosis.src = 'sosis.png';
    sosis.className = 'sosis';
    sosis.style.setProperty('--animation-speed', animationSpeed);
    
    const isGolden = Math.random() < goldenChance;
    if (isGolden) {
        sosis.classList.add('golden');
    }
    
    const size = sosisSize;
    sosis.style.width = size + 'px';
    
    const maxX = gameContainer.clientWidth - size;
    const maxY = gameContainer.clientHeight - size;
    const randomX = Math.random() * maxX;
    const randomY = Math.random() * maxY;
    
    sosis.style.left = randomX + 'px';
    sosis.style.top = randomY + 'px';
    
    sosis.addEventListener('click', () => {
        clickSosis(sosis, isGolden);
    });
    
    gameContainer.appendChild(sosis);
    
    const duration = (Math.random() * 2000 + 1000) * timeSlowFactor;
    setTimeout(() => {
        if (sosis.parentNode === gameContainer) {
            sosis.style.opacity = '0';
            sosis.style.transform = 'scale(0.5) translateY(50px)';
            setTimeout(() => {
                if (sosis.parentNode === gameContainer) {
                    gameContainer.removeChild(sosis);
                }
            }, 500);
        }
    }, duration);
}

function clickSosis(sosis, isGolden) {
    if (!sosis.parentNode) return;
    
    const currentTime = Date.now();
    const timeDiff = currentTime - lastClickTime;
    
    if (timeDiff < 500 && upgrades.combo_master.owned) {
        combo = Math.min(combo + 1, 10);
        updateCombo();
    } else {
        combo = 1;
    }
    
    clearTimeout(comboTimeout);
    comboTimeout = setTimeout(() => {
        combo = 1;
        updateCombo();
    }, 2000);
    
    lastClickTime = currentTime;
    
    const points = isGolden ? 5 : 1;
    const totalPoints = points * clickPower * combo;
    
    score += totalPoints;
    xp += totalPoints;
    
    showFloatingText(sosis, `+${totalPoints}`);
    playSound(isGolden ? 'golden' : 'pop');
    
    gameContainer.removeChild(sosis);
    spawnSosis();
    
    updateScore();
    checkLevelUp();
    checkAchievements();
}

function showFloatingText(element, text) {
    const floatingText = document.createElement('div');
    floatingText.className = 'floating-text';
    floatingText.textContent = text;
    
    const rect = element.getBoundingClientRect();
    floatingText.style.left = rect.left + 'px';
    floatingText.style.top = rect.top + 'px';
    
    document.getElementById('effects-container').appendChild(floatingText);
    
    setTimeout(() => {
        if (floatingText.parentNode) {
            floatingText.parentNode.removeChild(floatingText);
        }
    }, 1000);
}

function updateScore() {
    document.getElementById('score').textContent = `Puan: ${score}`;
}

function updateLevel() {
    const xpNeeded = level * 100;
    const progress = (xp / xpNeeded) * 100;
    
    document.getElementById('level').textContent = `Seviye: ${level}`;
    document.getElementById('xp-progress').style.width = `${progress}%`;
}

function checkLevelUp() {
    const xpNeeded = level * 100;
    while (xp >= xpNeeded) {
        level++;
        xp -= xpNeeded;
        showLevelUpEffect();
    }
    updateLevel();
}

function showLevelUpEffect() {
    const levelUpText = document.createElement('div');
    levelUpText.className = 'floating-text';
    levelUpText.style.fontSize = '36px';
    levelUpText.style.color = '#FFD700';
    levelUpText.textContent = `Seviye ${level}! 🎉`;
    
    levelUpText.style.left = '50%';
    levelUpText.style.top = '50%';
    levelUpText.style.transform = 'translate(-50%, -50%)';
    
    document.getElementById('effects-container').appendChild(levelUpText);
    playSound('levelUp');
    
    setTimeout(() => {
        if (levelUpText.parentNode) {
            levelUpText.parentNode.removeChild(levelUpText);
        }
    }, 2000);
}

function buyUpgrade(upgradeType) {
    const upgrade = upgrades[upgradeType];
    if (score >= upgrade.price && !upgrade.owned) {
        score -= upgrade.price;
        upgrade.owned = true;
        updateScore();
        
        switch(upgradeType) {
            case 'click_power':
                clickPower = 2;
                break;
            case 'auto_click':
                startAutoClicker();
                break;
            case 'sosis_size':
                sosisSize = 150;
                break;
            case 'golden_sosis':
                goldenChance = 0.1;
                break;
            case 'combo_master':
                // Already handled in clickSosis function
                break;
            case 'time_slow':
                timeSlowFactor = 1.5;
                break;
        }
        
        const shopItem = document.querySelector(`[onclick="buyUpgrade('${upgradeType}')"]`);
        shopItem.style.opacity = '0.5';
        shopItem.style.cursor = 'default';
        shopItem.onclick = null;
    }
}

function startAutoClicker() {
    if (!autoClickerInterval) {
        autoClickerInterval = setInterval(() => {
            const sosis = document.querySelector('.sosis');
            if (sosis) {
                const isGolden = sosis.classList.contains('golden');
                clickSosis(sosis, isGolden);
            }
        }, 3000);
    }
}

function initializeAchievements() {
    const container = document.getElementById('achievements-list');
    for (const [key, achievement] of Object.entries(achievements)) {
        const div = document.createElement('div');
        div.className = 'achievement';
        div.id = `achievement-${key}`;
        div.innerHTML = `
            <h3>${achievement.name}</h3>
            <p>${achievement.description}</p>
        `;
        container.appendChild(div);
    }
}

function checkAchievements() {
    // Click Master
    if (score >= achievements.clickMaster.requirement && !achievements.clickMaster.unlocked) {
        unlockAchievement('clickMaster');
    }
    
    // Combo King
    if (combo >= achievements.comboKing.requirement && !achievements.comboKing.unlocked) {
        unlockAchievement('comboKing');
    }
    
    // Level Up
    if (level >= achievements.levelUp.requirement && !achievements.levelUp.unlocked) {
        unlockAchievement('levelUp');
    }
    
    // Speed Demon
    const clicksInLastSecond = Array.from(document.getElementsByClassName('floating-text')).length;
    if (clicksInLastSecond >= achievements.speedDemon.requirement && !achievements.speedDemon.unlocked) {
        unlockAchievement('speedDemon');
    }
}

function unlockAchievement(achievementKey) {
    const achievement = achievements[achievementKey];
    if (!achievement.unlocked) {
        achievement.unlocked = true;
        
        const achievementElement = document.getElementById(`achievement-${achievementKey}`);
        achievementElement.classList.add('unlocked');
        
        showAchievementUnlock(achievement.name);
        playSound('achievement');
    }
}

function showAchievementUnlock(achievementName) {
    const unlockText = document.createElement('div');
    unlockText.className = 'floating-text';
    unlockText.style.fontSize = '24px';
    unlockText.style.color = '#FFD700';
    unlockText.textContent = `🏆 Başarım Açıldı: ${achievementName}`;
    
    unlockText.style.left = '50%';
    unlockText.style.top = '20%';
    unlockText.style.transform = 'translate(-50%, -50%)';
    
    document.getElementById('effects-container').appendChild(unlockText);
    
    setTimeout(() => {
        if (unlockText.parentNode) {
            unlockText.parentNode.removeChild(unlockText);
        }
    }, 3000);
}

// Oyunu başlat
window.onload = function() {
    gameContainer = document.getElementById('game-container');
    updateScore();
    updateLevel();
    initializeAchievements();
    
    // Event listeners
    document.getElementById('shop-button').addEventListener('click', () => {
        playSound('click');
        toggleShop();
    });

    document.getElementById('achievements-button').addEventListener('click', () => {
        playSound('click');
        toggleAchievements();
    });

    document.getElementById('settings-button').addEventListener('click', () => {
        playSound('click');
        toggleSettings();
    });
    
    // Sosis oluşturmayı başlat
    spawnInterval = setInterval(spawnSosis, spawnRate);
};
