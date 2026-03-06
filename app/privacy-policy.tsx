import React, { useState } from "react";
import {
    LayoutAnimation,
    Linking,
    Platform,
    SafeAreaView,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    UIManager,
    View,
} from "react-native";
const CREAM = "#F7F4EF";
const INK = "#1A1614";
const MUTED = "#6B6560";
const ACCENT = "#C4501A";
const CARD_BG = "#FFFFFF";
const BORDER = "#E8E4DE";

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: CREAM,
  },
  scroll: {
    flex: 1,
  },
  container: {
    paddingHorizontal: 20,
    paddingBottom: 60,
  },

  // Header
  header: {
    paddingTop: 36,
    paddingBottom: 28,
    alignItems: "center",
  },
  badge: {
    backgroundColor: ACCENT,
    borderRadius: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginBottom: 14,
  },
  badgeText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1.5,
    textTransform: "uppercase",
  },
  title: {
    fontSize: 32,
    fontWeight: "800",
    color: INK,
    letterSpacing: -0.5,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    color: MUTED,
    marginTop: 4,
    fontWeight: "500",
  },
  lastUpdated: {
    fontSize: 13,
    color: MUTED,
    marginTop: 8,
    fontStyle: "italic",
  },

  // Intro card
  introCard: {
    backgroundColor: CARD_BG,
    borderRadius: 12,
    padding: 18,
    borderWidth: 1,
    borderColor: BORDER,
    marginBottom: 20,
  },
  introText: {
    fontSize: 14,
    color: MUTED,
    lineHeight: 22,
  },

  // Controls
  controls: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
    justifyContent: "flex-end",
  },
  controlBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  controlBtnText: {
    fontSize: 13,
    color: ACCENT,
    fontWeight: "600",
  },
  divider: {
    width: 1,
    height: 14,
    backgroundColor: BORDER,
  },

  // Section card
  sectionCard: {
    backgroundColor: CARD_BG,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: BORDER,
    marginBottom: 10,
    overflow: "hidden",
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
  },
  sectionTitle: {
    flex: 1,
    fontSize: 14,
    fontWeight: "700",
    color: INK,
    lineHeight: 20,
    paddingRight: 8,
  },
  chevron: {
    fontSize: 11,
    color: MUTED,
  },
  sectionBody: {
    paddingHorizontal: 16,
    paddingBottom: 18,
    borderTopWidth: 1,
    borderTopColor: BORDER,
    paddingTop: 14,
  },

  // Text styles
  bodyText: {
    fontSize: 14,
    color: MUTED,
    lineHeight: 22,
  },
  subheading: {
    fontSize: 13,
    fontWeight: "700",
    color: INK,
    marginBottom: 6,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  bold: {
    fontWeight: "700",
    color: INK,
  },
  link: {
    color: ACCENT,
    textDecorationLine: "underline",
  },

  // Bullet
  bulletRow: {
    flexDirection: "row",
    marginTop: 8,
    paddingRight: 4,
  },
  bullet: {
    color: ACCENT,
    fontSize: 12,
    marginRight: 8,
    marginTop: 2,
  },
  bulletText: {
    flex: 1,
    fontSize: 14,
    color: MUTED,
    lineHeight: 22,
  },

  // Footer
  footer: {
    marginTop: 32,
    alignItems: "center",
    paddingTop: 24,
    borderTopWidth: 1,
    borderTopColor: BORDER,
  },
  footerText: {
    fontSize: 14,
    color: MUTED,
    textAlign: "center",
    lineHeight: 22,
  },
  footerMeta: {
    fontSize: 12,
    color: "#AAA49F",
    marginTop: 16,
    textAlign: "center",
    fontStyle: "italic",
  },
});

if (
  Platform.OS === "android" &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const CONTACT_EMAIL = "dmj08bot@gmail.com";
const LAST_UPDATED = "March 05, 2026";
const APP_NAME = "Social Calendar";
const WEBSITE = "social-calendar-checker.vercel.app";

interface Section {
  id: string;
  title: string;
  content: React.ReactNode;
}

const BodyText: React.FC<{ children: React.ReactNode; style?: object }> = ({
  children,
  style,
}) => <Text style={[styles.bodyText, style]}>{children}</Text>;

const LinkText: React.FC<{ href: string; children: React.ReactNode }> = ({
  href,
  children,
}) => (
  <Text style={styles.link} onPress={() => Linking.openURL(href)}>
    {children}
  </Text>
);

const BulletItem: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <View style={styles.bulletRow}>
    <Text style={styles.bullet}>▪</Text>
    <Text style={styles.bulletText}>{children}</Text>
  </View>
);

const SectionCard: React.FC<{
  section: Section;
  isExpanded: boolean;
  onToggle: () => void;
}> = ({ section, isExpanded, onToggle }) => {
  return (
    <View style={styles.sectionCard}>
      <TouchableOpacity
        style={styles.sectionHeader}
        onPress={onToggle}
        activeOpacity={0.7}
      >
        <Text style={styles.sectionTitle}>{section.title}</Text>
        <Text style={styles.chevron}>{isExpanded ? "▲" : "▼"}</Text>
      </TouchableOpacity>
      {isExpanded && <View style={styles.sectionBody}>{section.content}</View>}
    </View>
  );
};

const sections: Section[] = [
  {
    id: "summary",
    title: "Summary of Key Points",
    content: (
      <View>
        <BulletItem>
          <Text>
            <Text style={styles.bold}>Personal info: </Text>We collect info you
            provide when using our services.
          </Text>
        </BulletItem>
        <BulletItem>
          <Text>
            <Text style={styles.bold}>Sensitive info: </Text>We do not process
            sensitive personal information.
          </Text>
        </BulletItem>
        <BulletItem>
          <Text>
            <Text style={styles.bold}>Third parties: </Text>We do not collect
            information from third parties.
          </Text>
        </BulletItem>
        <BulletItem>
          <Text>
            <Text style={styles.bold}>Purpose: </Text>We process your
            information to provide, improve, and administer our Services.
          </Text>
        </BulletItem>
        <BulletItem>
          <Text>
            <Text style={styles.bold}>Security: </Text>We have organisational
            and technical measures in place, but no system is 100% secure.
          </Text>
        </BulletItem>
        <BodyText style={{ marginTop: 12 }}>
          Questions? Contact us at{" "}
          <LinkText href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</LinkText>
        </BodyText>
      </View>
    ),
  },
  {
    id: "infocollect",
    title: "1. What Information Do We Collect?",
    content: (
      <View>
        <Text style={styles.subheading}>Personal Information You Disclose</Text>
        <BodyText>
          We collect personal information you voluntarily provide when you
          register on the Services, express interest in our products,
          participate in activities, or contact us.
        </BodyText>
        <BodyText style={{ marginTop: 8 }}>
          The personal information we collect may include:
        </BodyText>
        <BulletItem>Names</BulletItem>
        <BulletItem>Email addresses</BulletItem>

        <Text style={[styles.subheading, { marginTop: 16 }]}>
          Sensitive Information
        </Text>
        <BodyText>We do not process sensitive information.</BodyText>

        <Text style={[styles.subheading, { marginTop: 16 }]}>
          Social Media Login Data
        </Text>
        <BodyText>
          We may provide the option to register using your existing social media
          account (e.g. Facebook or X). We will collect certain profile
          information from the provider as described in Section 5.
        </BodyText>

        <Text style={[styles.subheading, { marginTop: 16 }]}>
          Application Data
        </Text>
        <BodyText>If you use our app, we may also collect:</BodyText>
        <BulletItem>
          <Text>
            <Text style={styles.bold}>Mobile Device Access: </Text>Calendar
            access and other device features. You may change permissions in your
            device settings.
          </Text>
        </BulletItem>
        <BulletItem>
          <Text>
            <Text style={styles.bold}>Mobile Device Data: </Text>Device ID,
            model, OS, IP address, browser type, and app usage information.
          </Text>
        </BulletItem>
        <BulletItem>
          <Text>
            <Text style={styles.bold}>Push Notifications: </Text>We may request
            to send you push notifications. You can opt out in your device
            settings.
          </Text>
        </BulletItem>

        <Text style={[styles.subheading, { marginTop: 16 }]}>
          Information Automatically Collected
        </Text>
        <BodyText>
          We automatically collect certain technical information when you visit
          or use the Services, such as IP address, browser/device
          characteristics, OS, language preferences, and usage data.
        </BodyText>

        <Text style={[styles.subheading, { marginTop: 16 }]}>Google API</Text>
        <BodyText>
          Our use of information received from Google APIs adheres to the{" "}
          <LinkText href="https://developers.google.com/terms/api-services-user-data-policy">
            Google API Services User Data Policy
          </LinkText>
          , including the{" "}
          <LinkText href="https://developers.google.com/terms/api-services-user-data-policy#limited-use">
            Limited Use requirements
          </LinkText>
          .
        </BodyText>
      </View>
    ),
  },
  {
    id: "infouse",
    title: "2. How Do We Process Your Information?",
    content: (
      <View>
        <BodyText>
          We process your information to provide, improve, and administer our
          Services, communicate with you, for security and fraud prevention, and
          to comply with law. We process your personal information for the
          following reasons:
        </BodyText>
        <BulletItem>
          <Text>
            <Text style={styles.bold}>Account creation & authentication: </Text>
            To let you create and manage your account.
          </Text>
        </BulletItem>
        <BulletItem>
          <Text>
            <Text style={styles.bold}>Service delivery: </Text>To provide you
            with the requested service.
          </Text>
        </BulletItem>
        <BulletItem>
          <Text>
            <Text style={styles.bold}>User-to-user communications: </Text>To
            enable communication between users.
          </Text>
        </BulletItem>
        <BulletItem>
          <Text>
            <Text style={styles.bold}>Legal compliance: </Text>To comply with
            our legal obligations and defend our legal rights.
          </Text>
        </BulletItem>
      </View>
    ),
  },
  {
    id: "whoshare",
    title: "3. When and With Whom Do We Share Your Information?",
    content: (
      <View>
        <BodyText>
          We may need to share your personal information in the following
          situations:
        </BodyText>
        <BulletItem>
          <Text>
            <Text style={styles.bold}>Business Transfers: </Text>We may share
            your information in connection with a merger, sale, financing, or
            acquisition of our business.
          </Text>
        </BulletItem>
        <BulletItem>
          <Text>
            <Text style={styles.bold}>Other Users: </Text>When you share
            personal information publicly, it may be viewed by all users. If you
            register via a social network, your contacts may see your name,
            photo, and activity.
          </Text>
        </BulletItem>
      </View>
    ),
  },
  {
    id: "cookies",
    title: "4. Do We Use Cookies and Tracking Technologies?",
    content: (
      <View>
        <BodyText>
          We may use cookies and similar tracking technologies (web beacons,
          pixels) to gather information when you interact with our Services.
          These help maintain security, prevent crashes, save preferences, and
          support basic functions.
        </BodyText>
        <BodyText style={{ marginTop: 8 }}>
          We also permit third parties and service providers to use tracking
          technologies for analytics and advertising.
        </BodyText>
        <Text style={[styles.subheading, { marginTop: 16 }]}>
          Google Analytics
        </Text>
        <BodyText>
          We may share your information with Google Analytics to track and
          analyse use of the Services. To opt out, visit{" "}
          <LinkText href="https://tools.google.com/dlpage/gaoptout">
            https://tools.google.com/dlpage/gaoptout
          </LinkText>
          . For more, see the{" "}
          <LinkText href="https://policies.google.com/privacy">
            Google Privacy & Terms page
          </LinkText>
          .
        </BodyText>
      </View>
    ),
  },
  {
    id: "sociallogins",
    title: "5. How Do We Handle Your Social Logins?",
    content: (
      <View>
        <BodyText>
          If you register or log in using a social media account (e.g. Facebook
          or X), we will receive certain profile information from your social
          media provider — typically your name, email address, friends list, and
          profile picture.
        </BodyText>
        <BodyText style={{ marginTop: 8 }}>
          We use this information only for the purposes described in this
          Privacy Notice. We are not responsible for how your third-party social
          media provider uses your information, and we recommend reviewing their
          privacy notice.
        </BodyText>
      </View>
    ),
  },
  {
    id: "inforetain",
    title: "6. How Long Do We Keep Your Information?",
    content: (
      <View>
        <BodyText>
          We keep your personal information only for as long as necessary for
          the purposes set out in this Privacy Notice, or as required by law. We
          will not keep it longer than the period in which you have an account
          with us.
        </BodyText>
        <BodyText style={{ marginTop: 8 }}>
          When we have no ongoing legitimate business need, we will delete or
          anonymise your information, or securely isolate it until deletion is
          possible.
        </BodyText>
      </View>
    ),
  },
  {
    id: "infosafe",
    title: "7. How Do We Keep Your Information Safe?",
    content: (
      <View>
        <BodyText>
          We have implemented appropriate technical and organisational security
          measures to protect your personal information. However, no electronic
          transmission over the Internet or storage technology is 100% secure.
        </BodyText>
        <BodyText style={{ marginTop: 8 }}>
          Transmission of personal information to and from our Services is at
          your own risk. You should only access the Services within a secure
          environment.
        </BodyText>
      </View>
    ),
  },
  {
    id: "infominors",
    title: "8. Do We Collect Information from Minors?",
    content: (
      <View>
        <BodyText>
          We do not knowingly collect, solicit data from, or market to children
          under 18 years of age. By using the Services, you represent that you
          are at least 18, or that you are a parent or guardian consenting on
          behalf of a minor.
        </BodyText>
        <BodyText style={{ marginTop: 8 }}>
          If we learn that personal information from users under 18 has been
          collected, we will deactivate the account and delete the data. If you
          become aware of any such data, contact us at{" "}
          <LinkText href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</LinkText>.
        </BodyText>
      </View>
    ),
  },
  {
    id: "privacyrights",
    title: "9. What Are Your Privacy Rights?",
    content: (
      <View>
        <BodyText>
          You may review, change, or terminate your account at any time,
          depending on your country, province, or state of residence.
        </BodyText>
        <Text style={[styles.subheading, { marginTop: 16 }]}>
          Withdrawing Consent
        </Text>
        <BodyText>
          If we rely on your consent to process your personal information, you
          have the right to withdraw it at any time by contacting us using the
          details in Section 13.
        </BodyText>
        <Text style={[styles.subheading, { marginTop: 16 }]}>
          Account Information
        </Text>
        <BodyText>
          To review or change your account information, or to terminate your
          account, contact us using the contact information provided.
        </BodyText>
        <BodyText style={{ marginTop: 8 }}>
          Upon your request to terminate your account, we will deactivate or
          delete your account and information. However, we may retain some
          information to prevent fraud or comply with legal requirements.
        </BodyText>
        <BodyText style={{ marginTop: 8 }}>
          Questions? Email us at{" "}
          <LinkText href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</LinkText>.
        </BodyText>
      </View>
    ),
  },
  {
    id: "dnt",
    title: "10. Controls for Do-Not-Track Features",
    content: (
      <BodyText>
        Most web browsers and mobile operating systems include a Do-Not-Track
        ("DNT") feature. As no uniform technology standard for recognising DNT
        signals has been finalised, we do not currently respond to DNT browser
        signals. If a standard is adopted that we must follow in the future, we
        will inform you in a revised version of this Privacy Notice.
      </BodyText>
    ),
  },
  {
    id: "otherlaws",
    title: "11. Do Other Regions Have Specific Privacy Rights?",
    content: (
      <View>
        <Text style={styles.subheading}>Australia</Text>
        <BodyText>
          We collect and process your personal information under the obligations
          and conditions set by Australia's Privacy Act 1988 (Privacy Act).
        </BodyText>
        <BodyText style={{ marginTop: 8 }}>
          If you do not wish to provide the personal information necessary to
          fulfil the applicable purpose, it may affect our ability to:
        </BodyText>
        <BulletItem>
          Offer you the products or services that you want
        </BulletItem>
        <BulletItem>Respond to or help with your requests</BulletItem>
        <BulletItem>Manage your account with us</BulletItem>
        <BulletItem>Confirm your identity and protect your account</BulletItem>
        <BodyText style={{ marginTop: 8 }}>
          You have the right to request access to or correction of your personal
          information at any time by contacting us (see Section 14).
        </BodyText>
        <BodyText style={{ marginTop: 8 }}>
          If you believe we are unlawfully processing your personal information,
          you may submit a complaint to the{" "}
          <LinkText href="https://www.oaic.gov.au/privacy/privacy-complaints/lodge-a-privacy-complaint-with-us">
            Office of the Australian Information Commissioner
          </LinkText>
          .
        </BodyText>
      </View>
    ),
  },
  {
    id: "policyupdates",
    title: "12. Do We Make Updates to This Notice?",
    content: (
      <BodyText>
        We may update this Privacy Notice from time to time. The updated version
        will be indicated by an updated "Revised" date at the top. If we make
        material changes, we may notify you by posting a prominent notice or
        sending a notification. We encourage you to review this Notice
        frequently.
      </BodyText>
    ),
  },
  {
    id: "contact",
    title: "13. How Can You Contact Us About This Notice?",
    content: (
      <View>
        <BodyText>
          If you have questions or comments, you may contact us:
        </BodyText>
        <BulletItem>
          <Text>
            Email:{" "}
            <LinkText href={`mailto:${CONTACT_EMAIL}`}>
              {CONTACT_EMAIL}
            </LinkText>
          </Text>
        </BulletItem>
        <BulletItem>Post: Individual, Australia</BulletItem>
      </View>
    ),
  },
  {
    id: "request",
    title: "14. How Can You Review, Update, or Delete Your Data?",
    content: (
      <View>
        <BodyText>
          You have the right to request access to the personal information we
          collect from you, correct inaccuracies, or request deletion. You may
          also have the right to withdraw consent to our processing.
        </BodyText>
        <BodyText style={{ marginTop: 8 }}>
          To request a review, update, or deletion, please submit a{" "}
          <LinkText href="https://app.termly.io/dsar/58152822-ceb9-4d8b-9c74-e56fe247a6e0">
            data subject access request
          </LinkText>
          .
        </BodyText>
      </View>
    ),
  },
];

export default function PrivacyPolicyScreen() {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(["summary"]),
  );

  const toggleSection = (id: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedSections((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const expandAll = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedSections(new Set(sections.map((s) => s.id)));
  };

  const collapseAll = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedSections(new Set());
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor="#F7F4EF" />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>Legal</Text>
          </View>
          <Text style={styles.title}>Privacy Policy</Text>
          <Text style={styles.subtitle}>{APP_NAME}</Text>
          <Text style={styles.lastUpdated}>Last updated {LAST_UPDATED}</Text>
        </View>

        {/* Intro */}
        <View style={styles.introCard}>
          <Text style={styles.introText}>
            This Privacy Notice describes how and why we might access, collect,
            store, use, and/or share your personal information when you use our
            Services, including when you visit{" "}
            <Text
              style={styles.link}
              onPress={() => Linking.openURL(`https://${WEBSITE}`)}
            >
              {WEBSITE}
            </Text>{" "}
            or use the <Text style={styles.bold}>{APP_NAME}</Text> mobile
            application.
          </Text>
        </View>

        {/* Expand / Collapse controls */}
        <View style={styles.controls}>
          <TouchableOpacity style={styles.controlBtn} onPress={expandAll}>
            <Text style={styles.controlBtnText}>Expand all</Text>
          </TouchableOpacity>
          <View style={styles.divider} />
          <TouchableOpacity style={styles.controlBtn} onPress={collapseAll}>
            <Text style={styles.controlBtnText}>Collapse all</Text>
          </TouchableOpacity>
        </View>

        {/* Sections */}
        {sections.map((section) => (
          <SectionCard
            key={section.id}
            section={section}
            isExpanded={expandedSections.has(section.id)}
            onToggle={() => toggleSection(section.id)}
          />
        ))}

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Questions about this policy?{"\n"}
            <Text
              style={styles.link}
              onPress={() => Linking.openURL(`mailto:${CONTACT_EMAIL}`)}
            >
              {CONTACT_EMAIL}
            </Text>
          </Text>
          <Text style={styles.footerMeta}>
            Generated using Termly's Privacy Policy Generator
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
