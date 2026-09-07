export function getSiteSettings() {
  return {
    heroTitle: '따뜻한 품격으로 공간을 완성합니다.',
    heroSubtitle: 'jiyu design은 고급스러운 감성과 실용성을 함께 담아, 삶의 순간마다 편안함을 느끼는 공간을 설계합니다.',
    greeting: '안녕하세요. jiyu design 대표 전애리입니다.\n\n우리는 단순히 인테리어를 완성하는 것을 넘어, 고객의 삶과 취향이 가장 자연스럽게 드러나는 공간을 설계합니다.\n\n따뜻한 톤의 마감재, 정돈된 구성, 정성스럽게 다듬어진 디테일을 통해 일상 속에서 마음을 편안하게 만드는 공간을 제안합니다.\n\n고객과 함께 공간의 가능성을 찾고, 실사용성을 고려한 고급스러운 결과를 만들어갑니다.',
    email: 'hello@jiyu-design.com',
    address: '서울특별시 강남구 테헤란로 123, 7층 jiyu design',
    kakaoChannel: 'jiyudesign',
    ceoName: '전애리 대표',
  };
}

export function getHeroSlides() {
  return [
    { id: 1, title: 'Warm Minimal Living', image: '/images/hero-1.jpg' },
    { id: 2, title: 'Natural Stone Kitchen', image: '/images/hero-2.jpg' },
    { id: 3, title: 'Soft Luxury Suite', image: '/images/hero-3.jpg' },
  ];
}

export function getPortfolioHighlights() {
  return [
    { id: 2, title: 'Boutique Salon', category: '상업공간', year: '2024', description: '브랜드 경험을 살린 세련된 공간 연출과 고급 마감으로 리브랜딩을 완성했습니다.', coverImage: '/images/project-2.jpg' },
    { id: 3, title: 'Modern Loft Apartment', category: '리모델링', year: '2025', description: '좁은 평수의 한계를 극복하면서 고급스러움과 실용성을 동시에 담았습니다.', coverImage: '/images/project-3.jpg' },
  ];
}

export function getPortfolioProjects() {
  return [
    ...getPortfolioHighlights(),
    { id: 5, title: 'Stone Atelier', category: '상업공간', year: '2025', description: '프리미엄 감각이 살아있는 브랜드 스튜디오 제안.', coverImage: '/images/project-5.jpg' },
    { id: 6, title: 'Oak & Calm', category: '리모델링', year: '2023', description: '기존 구조를 살리면서 모던하고 고급스러운 리모델링을 완성했습니다.', coverImage: '/images/project-6.jpg' },
  ];
}
