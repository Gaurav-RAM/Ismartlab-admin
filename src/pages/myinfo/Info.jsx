import React, { useState, useRef, useEffect } from 'react';
import styled from 'styled-components';
import Slider from 'react-slick';
import 'slick-carousel/slick/slick.css';
import 'slick-carousel/slick/slick-theme.css';

// ---- Your actual Firebase imports below ----
import { auth, db } from '../../firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';

// ---- Styled Components ----
const Container = styled.div`
  background: #fafafb;
  min-height: 100vh;
  font-family: 'Inter', sans-serif;
`;

const Breadcrumb = styled.div`
  padding: 20px 40px 0;
  font-size: 14px;
  color: #888;
  display: flex;
  gap: 8px;
  @media (max-width: 600px) {
    padding: 10px 15px 0;
    font-size: 13px;
  }
`;

const CarouselWrapper = styled.div`
  display: flex;
  align-items: center;
  background: #fafafb;
  padding: 24px 0 0 0;
  width: 100%;
`;

const ArrowButton = styled.button`
  background: none;
  border: none;
  outline: none;
  cursor: pointer;
  font-size: 22px;
  color: #d3d3d8;
  display: flex;
  align-items: center;
  user-select: none;
  transition: color 0.2s;
  padding: 0 7px;
  &:hover { color: #fd6d6b; }
`;

const TabsScroll = styled.div`
  display: flex;
  overflow-x: auto;
  scrollbar-width: none;
  -ms-overflow-style: none;
  flex: 1;
  &::-webkit-scrollbar { display: none; }
`;

const TabBtn = styled.button`
  background: ${({ active }) => (active ? '#fd6d6b' : '#fff')};
  color: ${({ active }) => (active ? '#fff' : '#222')};
  font-weight: 600;
  border: none;
  border-radius: 28px;
  padding: 13px 42px;
  margin: 0 10px;
  font-size: 20px;
  transition: background 0.16s, color 0.16s;
  box-shadow: ${({ active }) => (active ? '0 2px 8px rgba(253,109,107,0.16)' : 'none')};
  white-space: nowrap;
  cursor: pointer;
  &:first-child { margin-left: 24px; }
  &:last-child { margin-right: 24px; }
  @media (max-width: 600px) {
    font-size: 16px;
    padding: 11px 22px;
    margin: 0 5px;
    &:first-child { margin-left: 10px; }
    &:last-child { margin-right: 10px; }
  }
`;

const MainCard = styled.div`
  background: #fff;
  margin: 25px 40px;
  border-radius: 16px;
  box-shadow: 0 2px 10px rgba(100,100,100,0.06);
  padding: 28px;
  display: flex;
  flex-direction: column;
  gap: 24px;
  @media (max-width: 800px) {
    margin: 18px 10px;
    padding: 18px;
  }
`;

const VendorInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 24px;
  padding-bottom: 12px;
  @media (max-width: 600px) {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }
`;

const ProfileImg = styled.img`
  width: 64px;
  height: 64px;
  border-radius: 50%;
  object-fit: cover;
  background: #e3e3e3;
`;

const Details = styled.div`
  flex: 1;
`;

const Name = styled.h2`
  font-size: 20px;
  font-weight: 600;
  margin: 0;
`;

const ContactRow = styled.div`
  margin-top: 5px;
  color: #888;
  font-size: 14px;
  display: flex;
  gap: 14px;
  flex-wrap: wrap;
`;

const Status = styled.span`
  background: #dafbe1;
  color: #37b363;
  border-radius: 7px;
  padding: 5px 13px;
  font-size: 14px;
  margin-left: 10px;
  font-weight: 500;
`;

const CarouselSection = styled.div`
  margin: 10px 0 24px 0;
  width: 100%;
  .slick-slider {
    border-radius: 12px;
    background: #f6f8fb;
    box-shadow: 0 1px 8px rgba(70,120,200,0.10);
  }
  .slick-slide {
    display: flex !important;
    justify-content: center;
    align-items: center;
    padding: 14px;
  }
  @media (max-width: 600px) {
    .slick-slide {
      padding: 7px;
    }
  }
`;

const CarouselCard = styled.div`
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(100,100,100,0.07);
  padding: 24px 22px;
  min-width: 220px;
  max-width: 350px;
  width: 90%;
  text-align: center;
`;

const FinancialRow = styled.div`
  display: flex;
  justify-content: space-between;
  gap: 32px;
  margin-top: 18px;
  @media (max-width: 900px) {
    flex-direction: column;
    gap: 18px;
  }
`;

const FBlock = styled.div`
  background: #f7f7f9;
  border-radius: 14px;
  flex: 1 1 300px;
  min-width: 220px;
  padding: 28px 24px;
  display: flex;
  flex-direction: column;
  height: 100%;
`;

const FTitle = styled.h3`
  margin: 0 0 10px 0;
  font-size: 20px;
  font-weight: 700;
  color: #232232;
`;

const FLabel = styled.span`
  color: #8b8b93;
  font-size: 18px;
  font-weight: 500;
  margin-bottom: 4px;
  display: block;
`;

const FValue = styled.span`
  color: #232232;
  font-size: 21px;
  font-weight: 700;
  margin-left: 25px;
`;

const FItem = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: 10px;
  font-size: 18px;
`;

const TaxLabel = styled.span`
  color: #6b7893;
  font-weight: 700;
  font-size: 19px;
`;

const NoTax = styled.span`
  font-size: 21px;
  font-weight: 700;
  color: #232232;
  margin-left: 2px;
`;

const CommissionLabel = styled(FLabel)`
  font-weight: 700;
`;

const PlanName = styled.span`
  font-size: 20px;
  font-weight: 700;
  color: #232232;
  margin-right: 20px;
`;

const PlanPrice = styled.span`
  color: #2B57EA;
  font-size: 26px;
  font-weight: 700;
  margin-right: 7px;
`;

const SmallText = styled.span`
  font-size: 16px;
  color: #747374;
  margin-left: 3px;
`;

const ExpiryText = styled.span`
  margin-left: 16px;
  color: #747374;
  font-size: 17px;
  font-weight: 500;
`;

const ActivePlanBadge = styled.span`
  background: #33c45a;
  color: #fff;
  border-radius: 7px;
  padding: 8px 16px;
  font-size: 16px;
  font-weight: 700;
  margin-left: 18px;
  display: inline-block;
`;

const ViewHistoryLink = styled.a`
  color: #2B57EA;
  font-size: 17px;
  font-weight: 500;
  float: right;
  text-decoration: none;
`;

// ---- Data arrays for demo ----
const tabLabels = [
  'Overview',
  'Collectors',
  'Appointments',
  'Payment History',
  'Ratings & Reviews',
  'Bank Details',
  'Labs',
  'Coupons',
  'Payouts',
  'Documents',
];

const carouselItems = [
  { title: "Vendor Overview", summary: "Active vendor stats, total revenue and commission details" },
  { title: "Lab Performance", summary: "View operational analytics, revenue sources, collector activity" },
  { title: "Upcoming Appointments", summary: "Next scheduled lab events and patient visits" }
];

const sliderSettings = {
  dots: true,
  infinite: true,
  speed: 400,
  slidesToShow: 2,
  slidesToScroll: 1,
  autoplay: true,
  responsive: [
    { breakpoint: 900, settings: { slidesToShow: 1 } }
  ]
};

function Info() {
  // Profile state
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [avatarUrl, setAvatarUrl] = useState(null);
  const [phone, setPhone] = useState("");       // If stored in Firestore
  const [address, setAddress] = useState("");   // If stored in Firestore
  const [status, setStatus] = useState("Active");
  const [earning, setEarning] = useState(137);       // Replace with user's data
  const [totalRevenue, setTotalRevenue] = useState(0); // Replace with user's data
  const [commissionFlat, setCommissionFlat] = useState(5);
  const [commissionTiered, setCommissionTiered] = useState(30);
  const [plan, setPlan] = useState("Premium Plan");
  const [planPrice, setPlanPrice] = useState(18);
  const [planExpiry, setPlanExpiry] = useState("2025-12-19");

  const lastBlobUrlRef = useRef("");
  const [activeTab, setActiveTab] = useState(0);
  const tabScrollRef = useRef();


function setAvatarFromBytes(bytesArray, mimeType) {
  try {
    const bytes =
      typeof bytesArray.toUint8Array === "function"
        ? bytesArray.toUint8Array()
        : new Uint8Array(bytesArray);
    const blob = new Blob([bytes], { type: mimeType || "image/jpeg" });
    if (lastBlobUrlRef.current) {
      URL.revokeObjectURL(lastBlobUrlRef.current);
    }
    const url = URL.createObjectURL(blob);
    lastBlobUrlRef.current = url;
    setAvatarUrl(url);
  } catch (error) {
    if (lastBlobUrlRef.current) {
      URL.revokeObjectURL(lastBlobUrlRef.current);
      lastBlobUrlRef.current = "";
    }
    setAvatarUrl(null);
  }
}


  // --- Firestore + Auth fetching ---
useEffect(() => {
  let unsubDoc = null;
  const unsubAuth = onAuthStateChanged(auth, (u) => {
    setDisplayName(u?.displayName || "");
    setEmail(u?.email || "");
    setAvatarUrl(u?.photoURL || null);
    if (unsubDoc) {
      unsubDoc();
      unsubDoc = null;
    }
    if (u) {
      const ref = doc(db, "users", u.uid);
      unsubDoc = onSnapshot(ref, (snap) => {
        if (!snap.exists()) return;
        const data = snap.data() || {};
        if (data.avatarBytes && data.avatarMime) {
          setAvatarFromBytes(data.avatarBytes, data.avatarMime);
          return;
        }
        const urlCandidates = [
          data.photoURL,
          data.avatarUrl,
          data.avatar,
          data.photo,
        ];
        const httpUrl = urlCandidates.find(
          (c) => typeof c === "string" && /^https?:\/\//i.test(c)
        );
        if (lastBlobUrlRef.current) {
          URL.revokeObjectURL(lastBlobUrlRef.current);
          lastBlobUrlRef.current = "";
        }
        setAvatarUrl(httpUrl || u.photoURL || null);
      });
    }
  });
  return () => {
    unsubAuth();
    if (unsubDoc) unsubDoc();
    if (lastBlobUrlRef.current) {
      URL.revokeObjectURL(lastBlobUrlRef.current);
      lastBlobUrlRef.current = "";
    }
  };
}, []);

  function handleTabArrow(direction) {
    if (tabScrollRef.current) {
      const amount = direction === 'left' ? -200 : 200;
      tabScrollRef.current.scrollBy({ left: amount, behavior: 'smooth' });
    }
  }

  return (
    <Container>
      <Breadcrumb>
        Dashboard &gt; {displayName || "Info"}
      </Breadcrumb>
      <CarouselWrapper>
        <ArrowButton onClick={() => handleTabArrow('left')} aria-label="Left arrow">&#x2039;</ArrowButton>
        <TabsScroll ref={tabScrollRef}>
          {tabLabels.map((label, idx) => (
            <TabBtn
              key={label}
              active={activeTab === idx}
              onClick={() => setActiveTab(idx)}
            >
              {label}
            </TabBtn>
          ))}
        </TabsScroll>
        <ArrowButton onClick={() => handleTabArrow('right')} aria-label="Right arrow">&#x203A;</ArrowButton>
      </CarouselWrapper>
      <MainCard>
        <VendorInfo>
          <ProfileImg src={avatarUrl || "https://randomuser.me/api/portraits/men/32.jpg"} alt={displayName || "Profile"} />
          <Details>
            <Name>
              {displayName || "Unnamed"} <Status>{status}</Status>
            </Name>
            <ContactRow>
              <a href={`mailto:${email}`}>{email}</a>
              {phone && <> | {phone}</>}
              {address && <> | {address}</>}
            </ContactRow>
          </Details>
        </VendorInfo>
        <CarouselSection>
          <Slider {...sliderSettings}>
            {carouselItems.map((item, idx) => (
              <CarouselCard key={idx}>
                <h4>{item.title}</h4>
                <p style={{ color: '#889' }}>{item.summary}</p>
              </CarouselCard>
            ))}
          </Slider>
        </CarouselSection>
        <FinancialRow>
  <FBlock>
    <FTitle>Earning and Tax</FTitle>
    <FItem>
      <FLabel>Total Earning:</FLabel>
      <FValue>$137.00</FValue>
    </FItem>
    <FItem>
      <FLabel>Total Revenue Generated:</FLabel>
      <FValue>$0.00</FValue>
    </FItem>
    <FItem>
      <TaxLabel>Taxes:</TaxLabel>
      <NoTax>No Tax Assigned</NoTax>
    </FItem>
  </FBlock>

  <FBlock>
    <FTitle>Commission</FTitle>
    <FItem>
      <CommissionLabel>Flat Percentage-Based Commission</CommissionLabel>
      <FValue>$5.00</FValue>
    </FItem>
    <FItem>
      <CommissionLabel>Tiered Commission</CommissionLabel>
      <FValue>30%</FValue>
    </FItem>
  </FBlock>

  <FBlock>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
      <FTitle style={{ marginBottom: 0 }}>Current Plan</FTitle>
      <ViewHistoryLink href="#">View History</ViewHistoryLink>
    </div>
    <FItem>
      <PlanName>Premium Plan</PlanName>
      <ExpiryText>Expiring On:</ExpiryText>
      <ExpiryText>2025-12-19</ExpiryText>
      <ActivePlanBadge>Active</ActivePlanBadge>
    </FItem>
    <FItem>
      <PlanPrice>$18.00</PlanPrice>
      <SmallText>/ 1 month</SmallText>
    </FItem>
  </FBlock>
</FinancialRow>

      </MainCard>
    </Container>
  );
}

export default Info;
