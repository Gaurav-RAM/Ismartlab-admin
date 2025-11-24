import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FiBell,
  FiMoon,
  FiSun,
  FiX,
  FiMenu,
  FiUser,
  FiInfo,
  FiRotateCcw,
  FiDollarSign,
  FiLogOut,
} from "react-icons/fi";
import styled, { css } from "styled-components";
import { useUI } from "../state/UIContext.jsx";
import { auth, db } from "../firebase.js";
import { onAuthStateChanged } from "firebase/auth";
import { doc, onSnapshot } from "firebase/firestore";

/* --- Styled Components --- */
const TopbarContainer = styled.div`
  width: 100%;
  background: var(--bg, #fff);
  border-bottom: 1px solid var(--border, #e3e8ee);
  position: sticky;
  top: 0;
  z-index: 1200;
`;

const TopbarHeader = styled.header`
  display: flex;
  align-items: center;
  justify-content: flex-end;
  min-height: 56px;
  padding: 0 12px;
  background: var(--bg, #fff);
  @media (max-width: 600px) {
    display: none;
  }
`;

const TopbarRowMobile = styled.header`
  display: none;
  @media (max-width: 600px) {
    display: flex;
    align-items: center;
    justify-content: space-between;
    height: 60px;
    padding: 0 9px;
    background: var(--bg, #fff);
    border-bottom: 1px solid #e3e8ee;
  }
`;

const LogoSection = styled.div`
  display: flex;
  align-items: center;
  gap: 7px;
  img {
    height: 17px;
    width: 17px;
  }
  span {
    font-size: 0.93rem;
    font-weight: 600;
    color: #212121;
  }
`;

const HamburgerBtn = styled.button`
  display: none;
  @media (max-width: 600px) {
    display: flex;
    align-items: center;
    justify-content: center;
    background: #fff;
    border: 1px solid #e3e8ee;
    border-radius: 11px;
    width: 30px;
    height: 30px;
    font-size: 19px;
    cursor: pointer;
  }
`;

const TopActions = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  border-bottom: 1px solid #e3e8ee;
`;

const controlBase = css`
  padding: 6px 10px;
  border: 1px solid var(--border);
  background: ${(props) =>
    props.$selected
      ? "var(--selected-bg, rgba(26,115,232,0.12))"
      : "transparent"};
  color: ${(props) =>
    props.$selected ? "var(--selected, #1a73e8)" : "var(--text)"};
  border-color: ${(props) =>
    props.$selected ? "var(--selected, #1a73e8)" : "var(--border)"};
  border-radius: 6px;
  line-height: 1;
  cursor: pointer;
  user-select: none;
  transition: background 120ms ease, color 120ms ease, border-color 120ms ease;
  &:hover {
    background: ${(props) =>
      props.$selected
        ? "var(--selected-bg, rgba(26,115,232,0.18))"
        : "var(--hover-bg, rgba(127,127,127,0.12))"};
    border-color: ${(props) =>
      props.$selected ? "var(--selected, #1a73e8)" : "var(--text)"};
    color: ${(props) =>
      props.$selected ? "var(--selected, #1a73e8)" : "var(--text)"};
  }
`;

const SizeLabel = styled.button`
  ${controlBase}
  font-size: 10px;
  padding: 4px 7px;
`;
const SizeBtn = styled.button`
  ${controlBase}
  font-size: 10px;
  padding: 4px 7px;
`;
const IconBtn = styled.button`
  padding: 5px;
  background: transparent;
  color: var(--text);
  border: 1px solid var(--border);
  border-radius: 6px;
  cursor: pointer;
  transition: background 120ms, border-color 120ms, color 120ms;
  font-size: 16px;
`;
const Badge = styled.span`
  padding: 2px 5px;
  border: 1px solid var(--border);
  border-radius: 12px;
  font-size: 11px;
  color: var(--text);
  background: transparent;
  min-width: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
`;
const ProfileWrap = styled.div`
  position: relative;
`;
const ProfileBtn = styled.button`
  display: flex;
  align-items: center;
  gap: 3px;
  padding: 1px;
  border-radius: 999px;
  background: transparent;
  border: 1px solid var(--border);
  color: var(--text);
  cursor: pointer;
  transition: background 120ms ease, border-color 120ms ease;
`;
const AvatarImg = styled.img`
  width: 23px;
  height: 23px;
  border-radius: 50%;
  object-fit: cover;
  display: block;
`;
const AvatarFallback = styled.div`
  width: 23px;
  height: 23px;
  border-radius: 50%;
  background-color: var(--muted, #e3e8ee);
  color: var(--text, #888);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 10px;
  font-weight: 600;
`;

/* Profile Menu Styles */
const ProfileMenuCard = styled.div`
  position: absolute;
  top: 44px;
  right: 0;
  width: 320px;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 12px 28px rgba(0,0,0,.12);
  border: 1px solid var(--border, #e3e8ee);
  z-index: 3000;
  overflow: hidden;
  animation: fadein 0.16s;
`;
const ProfileMenuHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 14px;
  background: #f0f2fa;
  padding: 16px 18px;
`;
const ProfileAvatar = styled.img`
  width: 48px;
  height: 48px;
  border-radius: 10px;
  display: block;
  object-fit: cover;
`;
const ProfileAvatarFallback = styled.div`
  width: 48px;
  height: 48px;
  border-radius: 10px;
  background: #f1f5f9;
  color: #888;
  font-weight: 700;
  font-size: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
`;
const ProfileMenuDetails = styled.div`
  flex: 1 1 0%;
  min-width: 0;
`;
const ProfileMenuName = styled.div`
  font-weight: 600;
  color: #313164;
  font-size: 1.08rem;
  margin-bottom: 2px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;
const ProfileMenuEmail = styled.div`
  color: #7f8493;
  font-size: 0.98rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;
const ProfileMenuList = styled.ul`
  list-style: none;
  margin: 0;
  padding: 5px 0 0 0;
`;
const ProfileMenuItem = styled.li`
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 22px;
  font-size: 1rem;
  color: #333;
  cursor: pointer;
  transition: background 0.12s;
  &:hover {
    background: #f1f5f9;
  }
`;
const ProfileMenuItemEnd = styled.span`
  margin-left: auto;
  color: #2563eb;
  font-weight: 600;
`;

/* Overlay for Mobile */
const MobileMenuOverlay = styled.div`
  @media (max-width: 600px) {
    position: fixed;
    top: 0;
    right: 0;
    left: 0;
    height: 16vh;
    max-height: 420px;
    background: #fff;
    z-index: 2100;
    display: flex;
    flex-direction: column;
    animation: fadein 180ms;
    margin: auto;
    border-radius: 0 0 22px 22px;
    overflow-y: auto;
    box-shadow: 0 8px 16px rgba(0,0,0,0.08);
  }
  @media (min-width: 601px) {
    display: none;
  }
`;
const OverlayHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 44px;
  padding: 0 9px;
  border-bottom: 1px solid #e3e8ee;
`;
const OverlayCloseBtn = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  background: #fff;
  border: 1px solid #e3e8ee;
  border-radius: 11px;
  width: 36px;
  height: 36px;
  font-size: 22px;
  cursor: pointer;
`;
const OverlayActionsBar = styled.div`
  display: flex;
  align-items: center;
  gap: 26px;
  padding: 13px 8px;
  flex-wrap: wrap;
  width: 100%;
  border-bottom: 1px solid #e3e8ee;
`;

export default function Topbar() {
  const navigate = useNavigate();
  const { theme, toggleTheme, smaller, larger } = useUI();

  const [open, setOpen] = useState(false);
  const [mobileMenu, setMobileMenu] = useState(false);
  const containerRef = useRef(null);
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [avatarUrl, setAvatarUrl] = useState(null);
  const [activeSize, setActiveSize] = useState("default");
  const lastBlobUrlRef = useRef("");
  const initials = useMemo(() => {
    const base = (displayName || email || "").trim();
    if (!base) return "U";
    const parts = base.split(/\s+/);
    const letters =
      parts.length === 1
        ? parts[0].slice(0, 2)
        : (parts[0][0] || "") + (parts[1][0] || "");
    return letters.toUpperCase();
  }, [displayName, email]);

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

  useEffect(() => {
    const onDocClick = (e) => {
      if (
        open &&
        containerRef.current &&
        !containerRef.current.contains(e.target)
      )
        setOpen(false);
    };
    const onEsc = (e) => {
      if (e.key === "Escape") {
        setOpen(false);
        setMobileMenu(false);
      }
    };
    document.addEventListener("click", onDocClick);
    document.addEventListener("keydown", onEsc);
    return () => {
      document.removeEventListener("click", onDocClick);
      document.removeEventListener("keydown", onEsc);
    };
  }, [open, mobileMenu]);

  function handleLogout() {
    setOpen(false);
    setMobileMenu(false);
    window.location.assign("/login");
  }

  const onDefault = () => {
    setActiveSize("default");
    try {
      document.documentElement.style.removeProperty("--font-scale");
    } catch {}
  };
  const onSmaller = () => {
    setActiveSize("smaller");
    smaller();
  };
  const onLarger = () => {
    setActiveSize("larger");
    larger();
  };

  return (
    <TopbarContainer>
      {/* Desktop/Web Header */}
      <TopbarHeader>
        <TopActions>
          <SizeLabel type="button" aria-label="Reset text size" onClick={onDefault} $selected={activeSize === "default"} title="Reset text size">A</SizeLabel>
          <SizeBtn type="button" onClick={onSmaller} $selected={activeSize === "smaller"} aria-pressed={activeSize === "smaller"} title="Smaller">A</SizeBtn>
          <SizeBtn type="button" onClick={onLarger} $selected={activeSize === "larger"} aria-pressed={activeSize === "larger"} title="Larger">A</SizeBtn>
          <IconBtn type="button" onClick={toggleTheme} aria-label="Toggle theme" title="Toggle theme">
            {theme === "light" ? <FiSun /> : <FiMoon />}
          </IconBtn>
          <IconBtn type="button" aria-label="Notifications"><FiBell size={20} /></IconBtn>
          <Badge><span role="img" aria-label="US Flag" style={{ marginRight: 2 }}>🇺🇸</span> EN</Badge>
          <ProfileWrap ref={containerRef}>
            <ProfileBtn type="button" onClick={() => setOpen((v) => !v)} aria-haspopup="menu" aria-expanded={open} aria-label="Open profile menu">
              {avatarUrl ? (
                <AvatarImg src={avatarUrl} alt="Profile"
                  referrerPolicy="no-referrer"
                  onError={() => {
                    if (lastBlobUrlRef.current) {
                      URL.revokeObjectURL(lastBlobUrlRef.current);
                      lastBlobUrlRef.current = "";
                    }
                    setAvatarUrl(null);
                  }}
                />
              ) : (
                <AvatarFallback aria-hidden="true">{initials}</AvatarFallback>
              )}
            </ProfileBtn>
            {open && (
              <ProfileMenuCard role="menu">
                <ProfileMenuHeader>
                  {avatarUrl ? (
                    <ProfileAvatar src={avatarUrl} alt="Profile" referrerPolicy="no-referrer" onError={() => setAvatarUrl(null)} />
                  ) : (
                    <ProfileAvatarFallback aria-hidden="true">{initials}</ProfileAvatarFallback>
                  )}
                  <ProfileMenuDetails>
                    <ProfileMenuName>{displayName || "User"}</ProfileMenuName>
                    <ProfileMenuEmail>{email || "—"}</ProfileMenuEmail>
                  </ProfileMenuDetails>
                </ProfileMenuHeader>
                <ProfileMenuList>
                  <ProfileMenuItem onClick={() => { setOpen(false); navigate("/profile"); }}><FiUser /> My Profile</ProfileMenuItem>
                  <ProfileMenuItem onClick={() =>{ setOpen(false); navigate("/info");}}><FiInfo /> My Info</ProfileMenuItem>
                  <ProfileMenuItem onClick={() => setOpen(false)}><FiRotateCcw /> Subscription History</ProfileMenuItem>
                  <ProfileMenuItem onClick={() => setOpen(false)}><FiDollarSign /> Wallet<ProfileMenuItemEnd>$0.00</ProfileMenuItemEnd></ProfileMenuItem>
                  <ProfileMenuItem onClick={handleLogout}><FiLogOut /> Logout</ProfileMenuItem>
                </ProfileMenuList>
              </ProfileMenuCard>
            )}
          </ProfileWrap>
        </TopActions>
      </TopbarHeader>

      {/* Mobile Header */}
      <TopbarRowMobile>
        <LogoSection>
          <img src="/kivilabs-logo.png" alt="IsmartLabs" />
          <span>IsmartLabs</span>
        </LogoSection>
        <HamburgerBtn onClick={() => setMobileMenu(true)} aria-label="Open menu">
          <FiMenu />
        </HamburgerBtn>
      </TopbarRowMobile>

      {/* Mobile Overlay Menu */}
      {mobileMenu && (
        <MobileMenuOverlay>
          <OverlayHeader>
            <LogoSection>
              <img src="/kivilabs-logo.png" alt="KiviLabs" />
              <span>KiviLabs</span>
            </LogoSection>
            <OverlayCloseBtn onClick={() => setMobileMenu(false)} aria-label="Close menu">
              <FiX />
            </OverlayCloseBtn>
          </OverlayHeader>
          <OverlayActionsBar>
            <SizeLabel type="button" aria-label="Reset text size" onClick={onDefault} $selected={activeSize === 'default'} title="Reset text size">A</SizeLabel>
            <SizeBtn type="button" onClick={onSmaller} $selected={activeSize === 'smaller'} aria-pressed={activeSize === 'smaller'} title="Smaller">A</SizeBtn>
            <SizeBtn type="button" onClick={onLarger} $selected={activeSize === 'larger'} aria-pressed={activeSize === 'larger'} title="Larger">A</SizeBtn>
            <IconBtn type="button" onClick={toggleTheme} aria-label="Toggle theme" title="Toggle theme">{theme === 'light' ? <FiSun /> : <FiMoon />}</IconBtn>
            <IconBtn type="button" aria-label="Notifications"><FiBell size={20} /></IconBtn>
            <Badge><span role="img" aria-label="US Flag" style={{ marginRight: 2 }}>🇺🇸</span> EN</Badge>
            <ProfileWrap ref={containerRef}>
              <ProfileBtn type="button" onClick={() => setOpen((v) => !v)} aria-haspopup="menu" aria-expanded={open} aria-label="Open profile menu">
                {avatarUrl ? (
                  <AvatarImg src={avatarUrl} alt="Profile"
                    onError={() => {
                      if (lastBlobUrlRef.current) {
                        URL.revokeObjectURL(lastBlobUrlRef.current);
                        lastBlobUrlRef.current = '';
                      }
                      setAvatarUrl(null);
                    }}
                  />
                ) : (
                  <AvatarFallback aria-hidden="true">{initials}</AvatarFallback>
                )}
              </ProfileBtn>
            </ProfileWrap>
          </OverlayActionsBar>
        </MobileMenuOverlay>
      )}
    </TopbarContainer>
  );
}
