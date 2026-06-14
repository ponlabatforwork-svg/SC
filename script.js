// ตั้งค่า Swiper
const lostSwiper = new Swiper(".lostItemSwiper", {
  slidesPerView: 1,
  spaceBetween: 20,
  pagination: { el: ".swiper-pagination", clickable: true },
  breakpoints: { 768: { slidesPerView: 3 } }
});

// ฟังก์ชันอัปโหลดรูปไป ImgBB แล้วได้ Link รูปภาพ
async function uploadToImgBB(file) {
  const formData = new FormData();
  formData.append('image', file);
  // แทนที่ด้วย API KEY ของคุณจาก imgbb.com
  const response = await fetch('https://api.imgbb.com/1/upload?key=bedf8b681488cb93f8a5dbfd6d698e58', {
    method: 'POST',
    body: formData
  });
  const data = await response.json();
  return data.data.url; // คืนค่า Link รูปภาพ
}

// ฟังก์ชันเพิ่มสไลด์ลงในหน้าจอ
function appendSlide(name, loc, type, imgUrl) {
  const slide = document.createElement('div');
  slide.className = 'swiper-slide glass rounded-3xl overflow-hidden p-4';
  slide.innerHTML = `
    <img src="${imgUrl}" class="w-full h-48 object-cover rounded-2xl mb-4" onerror="this.src='https://via.placeholder.com/400'">
    <h3 class="font-bold text-lg">${name}</h3>
    <p class="text-sm text-slate-500">${loc}</p>
    <span class="inline-block mt-2 px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-bold">${type}</span>
  `;
  lostSwiper.appendSlide(slide);
}

// ฟังก์ชันแจ้งของหาย
async function reportLostModal() {
  const { value: formValues } = await Swal.fire({
    title: 'แจ้งของหาย',
    html: '<input id="name" class="swal2-input" placeholder="ชื่อสิ่งของ"><input id="loc" class="swal2-input" placeholder="สถานที่"><input type="file" id="file" class="swal2-file">',
    preConfirm: async () => {
      const file = document.getElementById('file').files[0];
      const imgUrl = await uploadToImgBB(file); // อัปโหลดรูปก่อน
      return { 
        name: document.getElementById('name').value, 
        loc: document.getElementById('loc').value, 
        imgUrl: imgUrl 
      };
    }
  });

  if (formValues) {
    appendSlide(formValues.name, formValues.loc, 'Lost', formValues.imgUrl);
    // ส่งข้อมูลต่อไปยัง Google Sheet ผ่าน fetch() 
    // (ส่งเฉพาะ Text กับ URL รูปภาพ ไม่ต้องส่งรูปจริง)
  }
}
