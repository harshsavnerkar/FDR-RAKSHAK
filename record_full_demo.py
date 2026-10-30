#!/usr/bin/env python3
"""
FDR RAKSHAK - HIGH-FIDELITY AUTOMATED SCREENCAST RECORDER (EXTENDED PRESENTATION EDITION)
========================================================================================
Comprehensive 5-minute automated screencast covering:
  - Act 0: Sovereign RBAC Gateway (4 sovereign roles explanation)
  - Act 1: Institutional User (vit_mumbai) - Complete tab tours, dossier inspection, clean 01 and deficit 02 OCR
  - Act 2: Bank Nodal Desk (sbi_nodal) - CBS ledger inspection, Doc 03 CBS feed ingestion, discharge desk
  - Act 3: Scrutiny Officer (scrutiny_officer - The Maker) - Comprehensive tour + ALL 8 STATUTORY RULES EXPANDED & EXPLAINED
  - Act 4: AICTE Bureau Chief (aicte_admin - The Approver) - Command Center, Printable Safe Custody Slip, PostgreSQL Immutable Ledger

Target Duration: ~4.5 - 5.5 minutes
Framerate: 10 FPS (1920x1080 1080p Full HD)
"""

import os
import sys
import time
import json
import base64
import threading

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')
if hasattr(sys.stderr, 'reconfigure'):
    sys.stderr.reconfigure(encoding='utf-8', errors='replace')

import cv2
import numpy as np

from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

FPS = 10
WIDTH = 1920
HEIGHT = 1080
OUTPUT_VIDEO = "FDR_RAKSHAK_COMPLETE_APPLICATION_DEMO.mp4"

class VideoRecorder:
    def __init__(self, driver, output_path, fps=10, width=1920, height=1080):
        self.driver = driver
        self.output_path = output_path
        self.fps = fps
        self.width = width
        self.height = height
        self.running = False
        self.thread = None
        self.frame_count = 0
        fourcc = cv2.VideoWriter_fourcc(*'mp4v')
        self.writer = cv2.VideoWriter(output_path, fourcc, fps, (width, height))

    def _record_loop(self):
        interval = 1.0 / self.fps
        while self.running:
            start_t = time.time()
            try:
                result = self.driver.execute_cdp_cmd("Page.captureScreenshot", {
                    "format": "jpeg",
                    "quality": 85,
                    "fromSurface": True
                })
                img_data = base64.b64decode(result['data'])
                np_arr = np.frombuffer(img_data, np.uint8)
                frame = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)
                
                if frame is not None:
                    if frame.shape[1] != self.width or frame.shape[0] != self.height:
                        frame = cv2.resize(frame, (self.width, self.height))
                    self.writer.write(frame)
                    self.frame_count += 1
            except Exception:
                pass
            
            elapsed = time.time() - start_t
            sleep_time = interval - elapsed
            if sleep_time > 0:
                time.sleep(sleep_time)

    def start(self):
        self.running = True
        self.thread = threading.Thread(target=self._record_loop, daemon=True)
        self.thread.start()
        print(f"Screen Recording Engine Started @ {self.fps} FPS ({self.width}x{self.height})")

    def stop(self):
        self.running = False
        if self.thread:
            self.thread.join(timeout=3.0)
        self.writer.release()
        duration_sec = self.frame_count / self.fps
        print(f"Recording stopped. Captured {self.frame_count} frames (~{duration_sec:.1f}s / {duration_sec/60:.2f} mins total duration).")


def setup_browser():
    options = Options()
    options.add_argument("--window-size=1920,1080")
    options.add_argument("--disable-gpu")
    options.add_argument("--no-sandbox")
    options.add_argument("--disable-dev-shm-usage")
    options.add_argument("--disable-infobars")
    options.add_argument("--disable-notifications")
    options.add_argument("--force-device-scale-factor=1")
    options.add_argument("--hide-scrollbars=false")

    driver = webdriver.Chrome(options=options)
    driver.set_window_size(1920, 1080)
    return driver

def inject_virtual_cursor(driver):
    js = """
    if (!document.getElementById('virtual-cursor-element')) {
        const cursor = document.createElement('div');
        cursor.id = 'virtual-cursor-element';
        cursor.style.position = 'fixed';
        cursor.style.top = '100px';
        cursor.style.left = '100px';
        cursor.style.width = '24px';
        cursor.style.height = '24px';
        cursor.style.zIndex = '9999999';
        cursor.style.pointerEvents = 'none';
        cursor.style.transition = 'top 0.35s cubic-bezier(0.25, 1, 0.5, 1), left 0.35s cubic-bezier(0.25, 1, 0.5, 1), transform 0.15s ease';
        cursor.innerHTML = `
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M3 3L10.07 19.97L12.58 12.58L19.97 10.07L3 3Z" fill="#ff4757" stroke="#ffffff" stroke-width="2" stroke-linejoin="round"/>
            </svg>
        `;
        document.body.appendChild(cursor);
    }
    """
    try:
        driver.execute_script(js)
    except Exception:
        pass

def move_cursor_to(driver, x, y, duration=0.4):
    inject_virtual_cursor(driver)
    js = f"""
    const cursor = document.getElementById('virtual-cursor-element');
    if (cursor) {{
        cursor.style.left = '{x}px';
        cursor.style.top = '{y}px';
    }}
    """
    try:
        driver.execute_script(js)
    except Exception:
        pass
    time.sleep(duration)

def click_element(driver, el, pause_after=1.2):
    try:
        inject_virtual_cursor(driver)
        rect = driver.execute_script("return arguments[0].getBoundingClientRect();", el)
        target_x = int(rect['left'] + rect['width'] / 2)
        target_y = int(rect['top'] + rect['height'] / 2)
        move_cursor_to(driver, target_x, target_y, duration=0.4)
        
        # Click ripple effect
        driver.execute_script("""
            const cursor = document.getElementById('virtual-cursor-element');
            if (cursor) {
                cursor.style.transform = 'scale(0.8)';
                setTimeout(() => { cursor.style.transform = 'scale(1)'; }, 150);
            }
        """)
        time.sleep(0.15)
        driver.execute_script("arguments[0].click();", el)
    except Exception:
        try:
            driver.execute_script("arguments[0].click();", el)
        except Exception:
            pass
    time.sleep(pause_after)

def smooth_scroll_main(driver, down_px=500, steps=10, delay=0.12, pause_at_bottom=3.0):
    """
    Scrolls the main application viewport (<main> container) down smoothly,
    pauses for presenter explanation, and smoothly scrolls back up.
    """
    step_px = down_px // steps
    for _ in range(steps):
        try:
            driver.execute_script(f"""
                const m = document.querySelector('main');
                if (m) m.scrollBy(0, {step_px});
            """)
        except Exception:
            pass
        time.sleep(delay)
    time.sleep(pause_at_bottom)
    for _ in range(steps):
        try:
            driver.execute_script(f"""
                const m = document.querySelector('main');
                if (m) m.scrollBy(0, {-step_px});
            """)
        except Exception:
            pass
        time.sleep(delay)
    time.sleep(1.0)

def smooth_scroll_modal(driver, down_px=400, steps=8, delay=0.12, pause_at_bottom=2.5):
    """
    Scrolls inside an open modal dialog body.
    """
    step_px = down_px // steps
    for _ in range(steps):
        try:
            driver.execute_script(f"""
                const m = document.querySelector('div.overflow-y-auto') || document.querySelector('.max-h-\\\\[calc\\\\(85vh-160px\\\\)\\\\]');
                if (m) m.scrollBy(0, {step_px});
            """)
        except Exception:
            pass
        time.sleep(delay)
    time.sleep(pause_at_bottom)
    for _ in range(steps):
        try:
            driver.execute_script(f"""
                const m = document.querySelector('div.overflow-y-auto') || document.querySelector('.max-h-\\\\[calc\\\\(85vh-160px\\\\)\\\\]');
                if (m) m.scrollBy(0, {-step_px});
            """)
        except Exception:
            pass
        time.sleep(delay)
    time.sleep(0.8)

def logout_user(driver):
    print("  -> Logging out via user profile menu...")
    try:
        profile_btn = driver.find_elements(By.XPATH, "//button[@aria-label='User Profile Menu']")
        if profile_btn:
            click_element(driver, profile_btn[0], pause_after=1.0)
            signout_btn = driver.find_elements(By.XPATH, "//button[contains(., 'Sign Out') or contains(., 'Switch Persona')]")
            if signout_btn:
                click_element(driver, signout_btn[0], pause_after=1.8)
        
        time.sleep(1.2)
        
        is_login = driver.find_elements(By.XPATH, "//button[contains(., 'Access FDR Depository') or contains(., 'Bank Nodal Desk') or contains(., 'AICTE Bureau Chief')]")
        if not is_login:
            driver.execute_script("""
                fetch('http://localhost:8001/api/auth/logout', {method: 'POST', credentials: 'include'})
                    .finally(() => {
                        localStorage.clear();
                        sessionStorage.clear();
                        window.location.href = 'http://localhost:3001/';
                    });
            """)
            time.sleep(2.0)
            
        WebDriverWait(driver, 10).until(
            EC.presence_of_element_located((By.XPATH, "//button[contains(., 'Access FDR Depository') or contains(., 'Bank Nodal Desk') or contains(., 'AICTE Bureau Chief')]"))
        )
        time.sleep(1.5)
        inject_virtual_cursor(driver)
    except Exception as e:
        print(f"    Logout helper exception: {e}")
        driver.get("http://localhost:3001/")
        time.sleep(2.5)
        inject_virtual_cursor(driver)

def submit_login(driver):
    submit_btn = driver.find_element(By.XPATH, "//button[@type='submit']")
    click_element(driver, submit_btn, pause_after=3.0)

def click_sidebar_nav(driver, label_text, pause=2.2):
    print(f"  -> Navigating sidebar: [{label_text}]")
    driver.execute_script(f"""
        const btns = Array.from(document.querySelectorAll('aside button, aside a, nav button'));
        const target = btns.find(b => b.textContent && b.textContent.includes('{label_text}'));
        if (target) {{
            const rect = target.getBoundingClientRect();
            const cursor = document.getElementById('virtual-cursor-element');
            if (cursor) {{
                cursor.style.left = (rect.left + rect.width / 2) + 'px';
                cursor.style.top = (rect.top + rect.height / 2) + 'px';
            }}
            target.click();
        }}
    """)
    time.sleep(pause)

def run_demonstration():
    driver = setup_browser()
    driver.get("http://localhost:3001/")
    time.sleep(2.5)
    inject_virtual_cursor(driver)

    recorder = VideoRecorder(driver, OUTPUT_VIDEO, fps=FPS, width=WIDTH, height=HEIGHT)
    recorder.start()

    try:
        # =========================================================================
        # ACT 0: SOVEREIGN RBAC GATEWAY (~35s)
        # =========================================================================
        print("\n=== ACT 0: Sovereign Gateway & RBAC Personas ===")
        move_cursor_to(driver, 960, 220, duration=0.8)
        time.sleep(2.0)
        
        # Tour the 4 preset role cards with deliberate human pacing
        print("  -> Hovering over all 4 sovereign persona cards...")
        presets = driver.find_elements(By.XPATH, "//button[contains(., 'AICTE Bureau Chief') or contains(., 'Scrutiny Officer') or contains(., 'Institutional User') or contains(., 'Bank Nodal Desk')]")
        for p in presets[:4]:
            rect = driver.execute_script("return arguments[0].getBoundingClientRect();", p)
            move_cursor_to(driver, int(rect['left'] + rect['width']/2), int(rect['top'] + rect['height']/2), duration=0.6)
            time.sleep(2.2)

        # Highlight Security Profile Box at bottom of login card
        move_cursor_to(driver, 960, 840, duration=0.6)
        time.sleep(2.5)

        # =========================================================================
        # ACT 1: INSTITUTIONAL USER (vit_mumbai - College Admin) (~75s)
        # =========================================================================
        print("\n=== ACT 1: Institutional User (vit_mumbai) ===")
        college_card = driver.find_element(By.XPATH, "//button[contains(., 'Institutional User')]")
        click_element(driver, college_card, pause_after=1.2)
        submit_login(driver)

        # 1. Overview
        click_sidebar_nav(driver, "Overview", pause=2.5)
        print("    Inspecting Institutional Overview dashboard & scrolling...")
        smooth_scroll_main(driver, down_px=450, steps=10, delay=0.12, pause_at_bottom=3.5)

        # 2. My Deposited FDRs
        click_sidebar_nav(driver, "My Deposited FDRs", pause=2.5)
        print("    Inspecting FDR Repository Table...")
        smooth_scroll_main(driver, down_px=300, steps=6, delay=0.12, pause_at_bottom=2.5)
        
        # Open FDR Dossier Modal
        fdr_rows = driver.find_elements(By.XPATH, "//table//tbody//tr")
        if fdr_rows:
            print("  -> Opening Dossier Inspection Modal...")
            click_element(driver, fdr_rows[0], pause_after=2.5)
            
            # Tour all 4 dossier tabs with internal modal scrolling
            tabs = [
                ("Overview Dossier", 300),
                ("Compliance", 350),
                ("Risk & Maturity", 350),
                ("Lifecycle Workflows", 300)
            ]
            for tab_name, scroll_px in tabs:
                print(f"      Dossier Tab: [{tab_name}]")
                driver.execute_script(f"""
                    const btns = Array.from(document.querySelectorAll('button'));
                    const t = btns.find(b => b.textContent && b.textContent.includes('{tab_name}'));
                    if (t) t.click();
                """)
                time.sleep(2.0)
                smooth_scroll_modal(driver, down_px=scroll_px, steps=6, delay=0.12, pause_at_bottom=2.5)
            
            # Close Dossier Modal
            close_btn = driver.find_elements(By.XPATH, "//button[@aria-label='Close modal' or contains(., 'Close Dossier') or contains(@class, 'skeuo-btn')]")
            if close_btn:
                click_element(driver, close_btn[0], pause_after=1.5)

        # 3. Submit FDR / OCR Intake
        click_sidebar_nav(driver, "Submit FDR / OCR", pause=2.5)
        print("    Inspecting AI Document Intake Port...")
        smooth_scroll_main(driver, down_px=300, steps=6, delay=0.12, pause_at_bottom=2.0)
        
        # Upload Valid FDR: 01_INSTITUTE_VALID_FDR_CERTIFICATE.pdf
        valid_pdf_path = os.path.abspath("sample_test_documents/01_INSTITUTE_VALID_FDR_CERTIFICATE.pdf")
        if os.path.exists(valid_pdf_path):
            print("  -> Uploading Clean Test Document 01 (₹50L, 5-yr lock-in)...")
            file_input = driver.find_element(By.XPATH, "//input[@type='file']")
            file_input.send_keys(valid_pdf_path)
            time.sleep(2.0)
            
            process_btn = driver.find_elements(By.XPATH, "//button[contains(., 'Execute OCR Extraction') or contains(., 'Process Document')]")
            if process_btn:
                click_element(driver, process_btn[0], pause_after=4.0)
                print("      Showcasing extracted ₹50L fields and OCR confidence score...")
                smooth_scroll_main(driver, down_px=550, steps=10, delay=0.12, pause_at_bottom=4.0)
        
        # Upload Discrepant FDR: 02_INSTITUTE_DISCREPANCY_FDR_CERTIFICATE.pdf
        disc_pdf_path = os.path.abspath("sample_test_documents/02_INSTITUTE_DISCREPANCY_FDR_CERTIFICATE.pdf")
        if os.path.exists(disc_pdf_path):
            print("  -> Uploading Discrepancy Test Document 02 (₹35L, 1-yr deficit)...")
            clear_btn = driver.find_elements(By.XPATH, "//button[contains(., 'Clear & Re-scan') or contains(., 'Clear')]")
            if clear_btn:
                click_element(driver, clear_btn[0], pause_after=1.5)
            
            file_input = driver.find_element(By.XPATH, "//input[@type='file']")
            file_input.send_keys(disc_pdf_path)
            time.sleep(2.0)
            
            process_btn = driver.find_elements(By.XPATH, "//button[contains(., 'Execute OCR Extraction') or contains(., 'Process Document')]")
            if process_btn:
                click_element(driver, process_btn[0], pause_after=4.0)
                print("      Showcasing Red Statutory Discrepancy Alert Box...")
                smooth_scroll_main(driver, down_px=500, steps=8, delay=0.12, pause_at_bottom=4.5)

        # 4. Renewals & Maturity
        click_sidebar_nav(driver, "Renewals & Maturity", pause=2.5)
        print("    Inspecting Institutional Maturity Radar & Expirations...")
        smooth_scroll_main(driver, down_px=450, steps=8, delay=0.12, pause_at_bottom=3.5)

        # 5. Release Requests
        click_sidebar_nav(driver, "Release Requests", pause=2.5)
        print("    Inspecting Release Requests Desk...")
        smooth_scroll_main(driver, down_px=350, steps=6, delay=0.12, pause_at_bottom=2.5)
        req_btn = driver.find_elements(By.XPATH, "//button[contains(., 'Request FDR Release') or contains(., 'Encashment')]")
        if req_btn:
            click_element(driver, req_btn[0], pause_after=2.5)
            # Inspect modal form
            smooth_scroll_modal(driver, down_px=250, steps=5, delay=0.12, pause_at_bottom=2.5)
            close_modal = driver.find_elements(By.XPATH, "//button[@aria-label='Close modal' or contains(., 'Cancel')]")
            if close_modal:
                click_element(driver, close_modal[0], pause_after=1.5)

        # Logout Institutional User
        logout_user(driver)

        # =========================================================================
        # ACT 2: BANK NODAL DESK (sbi_nodal - State Bank of India) (~55s)
        # =========================================================================
        print("\n=== ACT 2: Bank Nodal Desk (sbi_nodal) ===")
        bank_card = driver.find_element(By.XPATH, "//button[contains(., 'Bank Nodal Desk')]")
        click_element(driver, bank_card, pause_after=1.2)
        submit_login(driver)

        # 1. Overview
        click_sidebar_nav(driver, "Overview", pause=2.5)
        print("    Inspecting Bank Branch Command Center...")
        smooth_scroll_main(driver, down_px=400, steps=8, delay=0.12, pause_at_bottom=3.5)

        # 2. Bank FDR Ledger
        click_sidebar_nav(driver, "Bank FDR Ledger", pause=2.5)
        print("    Inspecting SBI Branch Deposit Ledger...")
        smooth_scroll_main(driver, down_px=350, steps=6, delay=0.12, pause_at_bottom=2.5)
        
        fdr_rows = driver.find_elements(By.XPATH, "//table//tbody//tr")
        if fdr_rows:
            click_element(driver, fdr_rows[0], pause_after=2.2)
            smooth_scroll_modal(driver, down_px=300, steps=5, delay=0.12, pause_at_bottom=2.5)
            close_btn = driver.find_elements(By.XPATH, "//button[@aria-label='Close modal' or contains(., 'Close Dossier') or contains(@class, 'skeuo-btn')]")
            if close_btn:
                click_element(driver, close_btn[0], pause_after=1.2)

        # 3. AI Verification (CBS Feed Upload)
        click_sidebar_nav(driver, "AI Verification", pause=2.5)
        cbs_pdf_path = os.path.abspath("sample_test_documents/03_BANK_CBS_LIEN_CONFIRMATION_FEED.pdf")
        if os.path.exists(cbs_pdf_path):
            print("  -> Uploading Bank CBS Confirmation Feed 03...")
            file_input = driver.find_element(By.XPATH, "//input[@type='file']")
            file_input.send_keys(cbs_pdf_path)
            time.sleep(2.0)
            
            process_btn = driver.find_elements(By.XPATH, "//button[contains(., 'Execute OCR Extraction') or contains(., 'Process Document')]")
            if process_btn:
                click_element(driver, process_btn[0], pause_after=4.0)
                print("      Showcasing Bank-Verified Source Badge & CBS Lien Cross-Verification...")
                smooth_scroll_main(driver, down_px=500, steps=8, delay=0.12, pause_at_bottom=4.0)

        # 4. Release Requests (Bank Discharge Desk)
        click_sidebar_nav(driver, "Release Requests", pause=2.5)
        print("    Inspecting Bank Discharge Desk & Lien Revocation Queue...")
        smooth_scroll_main(driver, down_px=350, steps=6, delay=0.12, pause_at_bottom=3.0)

        # Logout Bank Node
        logout_user(driver)

        # =========================================================================
        # ACT 3: AICTE SCRUTINY OFFICER (scrutiny_officer - The Maker) (~95s)
        # =========================================================================
        print("\n=== ACT 3: AICTE Scrutiny Officer (scrutiny_officer) ===")
        scrutiny_card = driver.find_element(By.XPATH, "//button[contains(., 'Scrutiny Officer')]")
        click_element(driver, scrutiny_card, pause_after=1.2)
        submit_login(driver)

        # 1. Overview
        click_sidebar_nav(driver, "Overview", pause=2.5)
        print("    Inspecting Scrutiny Audit Dashboard...")
        smooth_scroll_main(driver, down_px=400, steps=8, delay=0.12, pause_at_bottom=3.0)

        # 2. Institutions
        click_sidebar_nav(driver, "Institutions", pause=2.5)
        print("    Inspecting Approved Institution Directory...")
        smooth_scroll_main(driver, down_px=450, steps=8, delay=0.12, pause_at_bottom=3.5)

        # 3. FDR Repository & THE 8-RULE AUTOMATED STATUTORY SENTRY (DETAILED SHOWCASE)
        click_sidebar_nav(driver, "FDR Repository", pause=2.5)
        print("    Opening FDR Repository...")
        smooth_scroll_main(driver, down_px=300, steps=5, delay=0.12, pause_at_bottom=2.0)
        
        fdr_rows = driver.find_elements(By.XPATH, "//table//tbody//tr")
        if fdr_rows:
            print("  -> Opening FDR Dossier for 8-Rule Compliance Audit...")
            click_element(driver, fdr_rows[0], pause_after=2.5)
            
            # Switch to Compliance Tab
            print("  -> Switching to [Compliance] Tab (8-Rule Sentry)...")
            driver.execute_script("""
                const compTab = Array.from(document.querySelectorAll('button')).find(b => b.textContent && b.textContent.includes('Compliance'));
                if (compTab) compTab.click();
            """)
            time.sleep(2.5)

            # Showcase Top Summary & Score
            print("      Inspecting Compliance Score & Outcome Metrics...")
            time.sleep(2.5)

            # Systematically expand and pause on each of the 8 rules
            print("  -> EXAMINING ALL 8 STATUTORY COMPLIANCE RULES IN DETAIL:")
            rule_names = [
                "Rule 1: Completeness of Mandatory Fields (RULE-REQ-FIELDS)",
                "Rule 2: Temporal Date Validity (RULE-DATE-VALIDITY)",
                "Rule 3: Mandatory AICTE 5-Year Lock-in & Chronology (RULE-DATE-ORDER)",
                "Rule 4: Statutory ₹50 Lakhs Norm & Parity (RULE-AMOUNT-MATCH)",
                "Rule 5: FDR Reference & Certificate Uniqueness (RULE-REF-MATCH)",
                "Rule 6: Joint Lien & Scheduled Bank Eligibility (RULE-ENTITY-MATCH)",
                "Rule 7: Proactive 90-Day Renewal Horizon (RULE-MATURITY-HORIZON)",
                "Rule 8: Cryptographic Attestation & Document Ingestion (RULE-DOC-LINKED)"
            ]

            for idx, rname in enumerate(rule_names):
                print(f"      Expanding {rname}...")
                driver.execute_script(f"""
                    const ruleHeaders = Array.from(document.querySelectorAll('div.cursor-pointer')).filter(el => 
                        el.textContent.includes('RULE-') || 
                        el.textContent.includes('PASS') || 
                        el.textContent.includes('FAIL') || 
                        el.textContent.includes('WARNING')
                    );
                    if (ruleHeaders[{idx}]) {{
                        ruleHeaders[{idx}].click();
                    }}
                    // Scroll container slightly to bring current rule into clear view
                    const m = document.querySelector('div.overflow-y-auto') || document.querySelector('.max-h-\\\\[calc\\\\(85vh-160px\\\\)\\\\]');
                    if (m) m.scrollBy(0, 110);
                """)
                time.sleep(3.2)  # Generous pause for presenter to explain each rule in detail!

            # Scroll to bottom of compliance audit to highlight Statutory Disclaimer
            print("      Highlighting Statutory Compliance Disclaimer at bottom...")
            driver.execute_script("""
                const m = document.querySelector('div.overflow-y-auto') || document.querySelector('.max-h-\\\\[calc\\\\(85vh-160px\\\\)\\\\]');
                if (m) m.scrollBy(0, 300);
            """)
            time.sleep(3.5)

            # Scroll back to top of modal
            driver.execute_script("""
                const m = document.querySelector('div.overflow-y-auto') || document.querySelector('.max-h-\\\\[calc\\\\(85vh-160px\\\\)\\\\]');
                if (m) m.scrollTo(0, 0);
            """)
            time.sleep(1.5)

            # Close Dossier Modal
            close_btn = driver.find_elements(By.XPATH, "//button[@aria-label='Close modal' or contains(., 'Close Dossier') or contains(@class, 'skeuo-btn')]")
            if close_btn:
                click_element(driver, close_btn[0], pause_after=1.5)

        # 4. AI Verification
        click_sidebar_nav(driver, "AI Verification", pause=2.5)
        print("    Inspecting OCR Intake Telemetry & Engine Health...")
        smooth_scroll_main(driver, down_px=350, steps=6, delay=0.12, pause_at_bottom=3.0)

        # 5. Renewals & Maturity
        click_sidebar_nav(driver, "Renewals & Maturity", pause=2.5)
        print("    Inspecting Scrutiny Risk & Maturity Horizon...")
        smooth_scroll_main(driver, down_px=400, steps=8, delay=0.12, pause_at_bottom=3.0)

        # 6. Release Scrutiny [Maker Queue]
        click_sidebar_nav(driver, "Release Scrutiny", pause=2.5)
        print("    Inspecting Release Scrutiny (Maker Review Queue)...")
        smooth_scroll_main(driver, down_px=400, steps=8, delay=0.12, pause_at_bottom=3.5)

        # 7. Reports & Analytics
        click_sidebar_nav(driver, "Reports & Analytics", pause=2.5)
        print("    Inspecting Compliance Analytics & Regional Reports...")
        smooth_scroll_main(driver, down_px=500, steps=10, delay=0.12, pause_at_bottom=4.0)

        # Logout Scrutiny Officer
        logout_user(driver)

        # =========================================================================
        # ACT 4: AICTE BUREAU CHIEF (aicte_admin - The Sovereign Approver) (~85s)
        # =========================================================================
        print("\n=== ACT 4: AICTE Bureau Chief (aicte_admin) ===")
        chief_card = driver.find_element(By.XPATH, "//button[contains(., 'AICTE Bureau Chief')]")
        click_element(driver, chief_card, pause_after=1.2)
        submit_login(driver)

        # 1. Overview (National Command Center)
        click_sidebar_nav(driver, "Overview", pause=2.5)
        print("    Inspecting National Command Center & macro KPIs...")
        smooth_scroll_main(driver, down_px=550, steps=10, delay=0.12, pause_at_bottom=4.0)

        # 2. Institutions
        click_sidebar_nav(driver, "Institutions", pause=2.5)
        print("    Inspecting National Institutional Vault Registry...")
        smooth_scroll_main(driver, down_px=400, steps=8, delay=0.12, pause_at_bottom=3.0)

        # 3. FDR Repository & Printable Safe Custody Slip
        click_sidebar_nav(driver, "FDR Repository", pause=2.5)
        print("    Opening FDR Repository...")
        fdr_rows = driver.find_elements(By.XPATH, "//table//tbody//tr")
        if fdr_rows:
            click_element(driver, fdr_rows[0], pause_after=2.2)
            
            # Click Print Slip to showcase Official Safe Custody Slip
            slip_btns = driver.find_elements(By.XPATH, "//button[contains(., 'Print Slip') or contains(., 'Custody Slip')]")
            if slip_btns:
                print("  -> Opening High-Resolution Safe Custody Slip Modal...")
                click_element(driver, slip_btns[0], pause_after=2.5)
                
                # Smooth scroll inside printable slip modal to tour all security seals & barcodes
                print("      Touring Barcode, Watermark, Tripartite Declaration & Bank Seals...")
                for _ in range(8):
                    driver.execute_script("""
                        const slip = document.getElementById('printable-custody-slip') || document.querySelector('.overflow-y-auto');
                        if (slip) slip.scrollBy(0, 75);
                    """)
                    time.sleep(0.18)
                time.sleep(4.5)  # Pause comfortably for explanation!
                
                for _ in range(8):
                    driver.execute_script("""
                        const slip = document.getElementById('printable-custody-slip') || document.querySelector('.overflow-y-auto');
                        if (slip) slip.scrollBy(0, -75);
                    """)
                    time.sleep(0.18)
                time.sleep(1.5)
                
                # Close slip modal
                close_slip = driver.find_elements(By.XPATH, "//button[contains(., 'Close') and not(contains(., 'Dossier'))]")
                if close_slip:
                    click_element(driver, close_slip[0], pause_after=1.2)
            
            # Close dossier modal
            close_dossier = driver.find_elements(By.XPATH, "//button[contains(., 'Close Dossier') or @aria-label='Close modal']")
            if close_dossier:
                click_element(driver, close_dossier[0], pause_after=1.2)

        # 4. Renewals & Maturity
        click_sidebar_nav(driver, "Renewals & Maturity", pause=2.5)
        print("    Inspecting National Proactive Maturity Radar...")
        smooth_scroll_main(driver, down_px=450, steps=8, delay=0.12, pause_at_bottom=3.5)

        # 5. Release Approvals [Approver Desk]
        click_sidebar_nav(driver, "Release Approvals", pause=2.5)
        print("    Inspecting Bureau Chief Release Approvals Queue...")
        smooth_scroll_main(driver, down_px=400, steps=8, delay=0.12, pause_at_bottom=3.5)

        # 6. Reports & Analytics
        click_sidebar_nav(driver, "Reports & Analytics", pause=2.5)
        print("    Inspecting Executive Reports & Analytical Dashboards...")
        smooth_scroll_main(driver, down_px=500, steps=10, delay=0.12, pause_at_bottom=3.5)

        # 7. Audit Trail (PostgreSQL Immutable Cryptographic Ledger)
        click_sidebar_nav(driver, "Audit Trail", pause=2.5)
        print("  -> Touring PostgreSQL ACID Cryptographic Immutable Ledger...")
        smooth_scroll_main(driver, down_px=600, steps=12, delay=0.15, pause_at_bottom=5.0)

        # 8. Settings
        click_sidebar_nav(driver, "Settings", pause=2.5)
        print("    Inspecting Bureau System Settings & Key Derivation Profiles...")
        smooth_scroll_main(driver, down_px=350, steps=6, delay=0.12, pause_at_bottom=3.0)

        # Grand Finale return to Overview Dashboard
        click_sidebar_nav(driver, "Overview", pause=3.0)
        print("  -> Authoritative return to National Overview Dashboard.")
        smooth_scroll_main(driver, down_px=350, steps=6, delay=0.12, pause_at_bottom=3.0)

        print("\nDemonstration Walkthrough Completed Successfully!")

    except Exception as e:
        print(f"\nError during demo execution: {e}")
        import traceback
        traceback.print_exc()
    finally:
        recorder.stop()
        try:
            driver.quit()
        except Exception:
            pass
        
        # Mirror to artifacts directory
        artifact_path = r"C:\Users\Harsh\.gemini\antigravity\brain\5e767bce-79f2-475d-85a3-863b1d3aa387\FDR_RAKSHAK_COMPLETE_APPLICATION_DEMO.mp4"
        import shutil
        if os.path.exists(OUTPUT_VIDEO):
            try:
                shutil.copyfile(OUTPUT_VIDEO, artifact_path)
                print(f"Video mirrored to artifacts: {artifact_path}")
            except Exception as ce:
                print(f"Warning: Could not mirror to artifacts: {ce}")

if __name__ == '__main__':
    run_demonstration()
