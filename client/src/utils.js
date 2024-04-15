export function getCookie(name) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
}

export function setCookie(name, value, days, secure = false, sameSite = 'Lax') {
    let expires = "";
    if (days) {
        const date = new Date();
        date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
        expires = "; expires=" + date.toUTCString();
    }
    // Adding secure and SameSite to the cookie string
    document.cookie = name + "=" + (value || "") + expires + "; path=/"
        + (secure ? "; Secure" : "") 
        + "; SameSite=" + sameSite;
}

export function generatePlayerId() {
    return 'xxxx-xxxx-xxxx'.replace(/[x]/g, function(c) {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3) | 0x8;
        return v.toString(16);
    });
}

const imageIds = {
  X: ["https://res.cloudinary.com/dwhennrjl/image/upload/v1713184800/media/xos/xosx2_fbt8a1.png",
  "https://res.cloudinary.com/dwhennrjl/image/upload/v1713184800/media/xos/xosx1_fiwvj5.png"],
  O: ["https://res.cloudinary.com/dwhennrjl/image/upload/v1713184800/media/xos/xos01_txfaee.png",
  "https://res.cloudinary.com/dwhennrjl/image/upload/v1713184800/media/xos/xos02_qyu2ys.png"],
  Crown: [
    "https://res.cloudinary.com/dwhennrjl/image/upload/v1713195283/media/xos/crowns/crowns9_uzokn1.png",
    "https://res.cloudinary.com/dwhennrjl/image/upload/v1713195282/media/xos/crowns/crowns8_iiaks4.png",
    "https://res.cloudinary.com/dwhennrjl/image/upload/v1713195282/media/xos/crowns/crowns7_wiztl9.png",
    "https://res.cloudinary.com/dwhennrjl/image/upload/v1713195281/media/xos/crowns/crowns6_il8b1u.png",
    "https://res.cloudinary.com/dwhennrjl/image/upload/v1713195280/media/xos/crowns/crowns5_yadand.png",
    "https://res.cloudinary.com/dwhennrjl/image/upload/v1713195280/media/xos/crowns/crowns4_gp30aj.png",
    "https://res.cloudinary.com/dwhennrjl/image/upload/v1713195279/media/xos/crowns/crowns3_rcifxg.png",
    "https://res.cloudinary.com/dwhennrjl/image/upload/v1713195278/media/xos/crowns/crowns23_pwfpm9.png",
    "https://res.cloudinary.com/dwhennrjl/image/upload/v1713195277/media/xos/crowns/crowns22_etoald.png",
    "https://res.cloudinary.com/dwhennrjl/image/upload/v1713195277/media/xos/crowns/crowns21_kyvnmj.png",
    "https://res.cloudinary.com/dwhennrjl/image/upload/v1713195276/media/xos/crowns/crowns20_wwczh0.png",
    "https://res.cloudinary.com/dwhennrjl/image/upload/v1713195275/media/xos/crowns/crowns2_hb7jx3.png",
    "https://res.cloudinary.com/dwhennrjl/image/upload/v1713195275/media/xos/crowns/crowns19_darfke.png",
    "https://res.cloudinary.com/dwhennrjl/image/upload/v1713195274/media/xos/crowns/crowns18_eykycd.png",
    "https://res.cloudinary.com/dwhennrjl/image/upload/v1713195273/media/xos/crowns/crowns17_ffsrjx.png",
    "https://res.cloudinary.com/dwhennrjl/image/upload/v1713195272/media/xos/crowns/crowns16_d4auwz.png",
    "https://res.cloudinary.com/dwhennrjl/image/upload/v1713195272/media/xos/crowns/crowns15_jyvs9v.png",
    "https://res.cloudinary.com/dwhennrjl/image/upload/v1713195271/media/xos/crowns/crowns14_fvxtoo.png",
    "https://res.cloudinary.com/dwhennrjl/image/upload/v1713195270/media/xos/crowns/crowns13_wmbdby.png",
    "https://res.cloudinary.com/dwhennrjl/image/upload/v1713195270/media/xos/crowns/crowns12_ppocrq.png",
    "https://res.cloudinary.com/dwhennrjl/image/upload/v1713195268/media/xos/crowns/crowns11_babgnm.png",
    "https://res.cloudinary.com/dwhennrjl/image/upload/v1713195268/media/xos/crowns/crowns10_sgn1kh.png",
    "https://res.cloudinary.com/dwhennrjl/image/upload/v1713195268/media/xos/crowns/crowns1_xff8js.png"
  ]
};

export const getRandomImageId = (symbol) => {
    if (!imageIds[symbol]) {
      throw new Error('Invalid symbol');
    }
    const ids = imageIds[symbol];
    const randomIndex = Math.floor(Math.random() * ids.length);
    return ids[randomIndex];
};

const adjectives = ['Swift', 'Brave', 'Clever', 'Witty', 'Mighty'];
const nouns = ['Panda', 'Fox', 'Eagle', 'Tiger', 'Bear'];

export function generateUsername() {
  const adjective = adjectives[Math.floor(Math.random() * adjectives.length)];
  const noun = nouns[Math.floor(Math.random() * nouns.length)];
  return `${adjective}${noun}`;
}