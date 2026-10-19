-- =====================================================================
-- SCP Foundation Catalogue: seed data
-- COMP.6210 Assignment 2
--
-- Loads the catalogue subjects into the tables created by schema.sql.
-- Run this whole file in the Supabase dashboard: SQL Editor > New query.
--
-- Before running:
--   1. schema.sql has been run.
--   2. The subject images are uploaded to the scp-images storage bucket in a
--      folder called "seed" (scp-images/seed/scp-002.jpg, ...). image_url
--      below holds each image's public URL.
--
-- How it works
--   - Seeded subjects have owner_id = NULL: they belong to no editor, so
--     only admins can edit them (see the RLS policies in schema.sql).
--   - The SQL Editor runs as an admin role that bypasses Row Level
--     Security, which is why these inserts are allowed.
--   - Each section is linked to its subject by looking the subject up by
--     its item number, so no ids are hardcoded.
--   - position numbers keep paragraphs in their original order.
--   - Safe to run again: it first deletes these subjects, and ON DELETE
--     CASCADE removes all their sections, so nothing is duplicated.
--   - Everything runs in one transaction: if any statement fails, none of
--     the changes are kept.
-- =====================================================================

begin;

-- Remove any previous copy of these subjects (cascades to their sections).
delete from public.scp_subjects
where item in ('SCP-002', 'SCP-003', 'SCP-004', 'SCP-005', 'SCP-006');

-- ---------------------------------------------------------------------
-- SCP-002 (Euclid)
-- ---------------------------------------------------------------------
insert into public.scp_subjects (item, object_class_id, summary, image_url, image_alt, owner_id)
values (
  'SCP-002',
  (select id from public.object_classes where name = 'Euclid'),
  'A fleshy, tumor-like structure containing an apartment-like interior formed from transformed human biological material.',
  'https://cpubzanyrlsbmqasawdm.supabase.co/storage/v1/object/public/scp-images/seed/scp-002.jpg',
  'SCP-002 specimen in containment',
  null
);

-- Special Containment Procedures
insert into public.containment_procedures (subject_id, position, body)
select (select id from public.scp_subjects where item = 'SCP-002'), v.position, v.body
from (values
  (1, 'SCP-002 is to remain connected to a suitable power supply at all times, to keep it in what appears to be a recharging mode. In case of electrical outage, the emergency barrier between the object and the facility is to be closed and the immediate area evacuated. Once facility power is re-established, alternating bursts of X-ray and ultraviolet light must strobe the area until SCP-002 is re-affixed to the power supply and returned to recharging mode. Containment area is to be kept at negative air pressure at all times.'),
  (2, 'Teams including a minimum of two (2) members are required within 20 meters of SCP-002 or its containment area. Personnel should maintain physical contact with one another at all times to confirm there is another person present, as perception may be dulled, skewed, or influenced by proximity to the object.'),
  (3, 'No personnel below Level 3 are permitted within SCP-002. This requirement may be waived via written authorization from two (2) off-site Level 4 administrators. Command staff issued such a waiver must be escorted by at least five (5) Level 3 Security personnel for the duration of their contact and must temporarily surrender their rank and security clearance. Following contact, command staff will be escorted at least 5 km from SCP-002 to undergo a seventy-two (72)-hour quarantine and psychological evaluation. If deemed fit for return to duty by psych staff, rank and security clearance may be restored when quarantine expires.')
) as v(position, body);

-- Description
insert into public.descriptions (subject_id, position, body)
select (select id from public.scp_subjects where item = 'SCP-002'), v.position, v.body
from (values
  (1, 'SCP-002 resembles a tumorous, fleshy growth with a volume of roughly 60 m³ (or 2000 ft³). An iron valve hatch on one side leads to its interior, which appears to be a standard low-rent apartment of modest size. One wall of the room possesses a single window, though no such opening is visible from the exterior. The room contains furniture which, upon close examination, appears to be sculpted bone, woven hair, and various other biological substances produced by the human body. All matter tested thus far show independent or fragmented DNA sequences for each object in the room.'),
  (2, 'Refer to the Mulhausen Report [cross-ref:document00.023.603] for details related to object''s discovery.')
) as v(position, body);

-- Reference
insert into public.subject_references (subject_id, position, body)
select (select id from public.scp_subjects where item = 'SCP-002'), v.position, v.body
from (values
  (1, 'To date, subject has been responsible for the disappearances of seven personnel. It has also in its time at the facility further furnished itself with two lamps, a throw rug, a television, a radio, a beanbag chair, three books in an unknown language, four children''s toys, and a small potted plant. Tests with a variety of lab animals including higher primates have failed to provoke a response in SCP-002. Cadavers as well fail to produce any effect. Whatever process the subject uses to convert organic matter into furnishings is apparently only facilitated by the introduction of living humans.')
) as v(position, body);

-- Field report (the report row first, then its entries linked to it)
insert into public.field_reports (subject_id, title, intro)
values ((select id from public.scp_subjects where item = 'SCP-002'), 'Mulhausen Report — docid:00.023.603', 'The following is a brief report detailing the discovery of SCP-002');

insert into public.field_report_entries (field_report_id, position, body)
select fr.id, v.position, v.body
from public.field_reports fr
cross join (values
  (1, 'Subject was discovered in a small crater in northern Portugal where it struck the Earth from orbit. Encased in a shell of thick rock, the fleshy exterior of the object was exposed by the impact. A native farmer happened upon the site and reported his findings to the village elder. Subject gained SCP attention when a Level 4 agent posted in the area detected a small radioactive anomaly generated by the object.'),
  (2, 'A collection squad of SCP security personnel led by General Mulhausen was immediately dispatched to the area where they quickly secured the subject in a large container and performed initial testing with subjects recruited from the nearby village. Three men individually sent into the structure subsequently disappeared. Upon discovering this deadly property of the subject, General Mulhausen issued a Level 4a Termination Order of any witnesses (roughly 1/3 of the village) to ensure no outside knowledge of the object and initiated its transport to SCP facility [DATA REDACTED].'),
  (3, 'During preparation for transport, four SCP security personnel were inexplicably drawn inside the object where they too immediately disappeared. Following inspection, it appeared as if the object had "grown" several new furnishings and was beginning to look like the interior of an apartment room. General Mulhausen immediately ordered the requisition of several Class III HAZMAT suits for the remaining security team members, who proceeded to lift the container onto a waiting freight ship for transport to the SCP containment facility.'),
  (4, '[DATA REDACTED]'),
  (5, '[DATA REDACTED]'),
  (6, 'Following the termination of General Mulhausen, SCP-002 was re-secured by SCP staff and brought into special containment in [CLASSIFIED], where it currently resides. Staff with clearance below Level 3 have been denied access to the SCP-002 container without prior approval of at least two Level 4 staff after the Mulhausen incident.')
) as v(position, body)
where fr.subject_id = (select id from public.scp_subjects where item = 'SCP-002');

-- ---------------------------------------------------------------------
-- SCP-003 (Euclid)
-- ---------------------------------------------------------------------
insert into public.scp_subjects (item, object_class_id, summary, image_url, image_alt, owner_id)
values (
  'SCP-003',
  (select id from public.object_classes where name = 'Euclid'),
  'A sentient biological circuit-like mass restrained on an ancient rune-inscribed tablet, dormant only above critical temperature.',
  'https://cpubzanyrlsbmqasawdm.supabase.co/storage/v1/object/public/scp-images/seed/scp-003.jpg',
  'SCP-003 biological circuitry structure',
  null
);

-- Special Containment Procedures
insert into public.containment_procedures (subject_id, position, body)
select (select id from public.scp_subjects where item = 'SCP-003'), v.position, v.body
from (values
  (1, 'SCP-003 is to be maintained at a constant temperature of no less than 35°C and ideally kept above 100°C. No living multicellular organisms of Category IV or higher complexity may be allowed to come into contact with SCP-003.'),
  (2, 'In event of total power failure, if SCP-003-1 begins to increase its mass, assigned personnel must engage in skin contact with SCP-003-1. Ideally, personnel may use their body heat to return SCP-003-1 to above the critical temperature; however, skin contact must be maintained even in event of SCP-003 reaching activation temperature, lasting at minimum until SCP-003-1 advances fully to its second growth stage.'),
  (3, 'Personnel who enter SCP-003''s containment area must first be examined for body parasites of Category IV or higher complexity, and sterilized if such organisms are present. All personnel who have come in physical contact with SCP-003-1 are to immediately report for sterilization afterwards.'),
  (4, 'SCP-003-1 must not be removed from SCP-003-2 except in case of emergency procedures detailed above. Any significant change in SCP-003-2''s rune activity (including pattern, frequency, or color) should be reported within three (3) hours of occurrence. Cessation of rune activity must be reported immediately. SCP-003-2 must be supplied with power via the source designated Generator 003-IX at all times.')
) as v(position, body);

-- Description
insert into public.descriptions (subject_id, position, body)
select (select id from public.scp_subjects where item = 'SCP-003'), v.position, v.body
from (values
  (1, 'SCP-003 consists of two related components of separate origin, referred to as SCP-003-1 and SCP-003-2.'),
  (2, 'SCP-003-1 appears to be composed of chitin, hair, and nails of unknown biology, arranged in a configuration similar to that of a computer motherboard. Testing reveals SCP-003-1 to predate earliest known circuit boards by a factor of thousands of years. SCP-003-1 is considered sentient but not actively dangerous except under certain conditions.'),
  (3, 'SCP-003-1 was found on a stone tablet, SCP-003-2, on which it currently resides. The runes on SCP-003-2 are not part of any known language, and emit pale, flickering light patterns.'),
  (4, 'SCP-003-2 is controlled by a (non-biological) internal computer, the contents of which are mostly inaccessible without risk of damaging SCP-003-2. SCP-003-2 is capable of controlled emissions of radiation, including heat, light, and anomalous radiation types. SCP-003-2 contains an internal power source of an anomalous nature, which appears to have been losing power since several centuries before discovery.'),
  (5, 'It is considered probable that SCP-003-2 was created for the purpose of containing SCP-003-1. Partially interpreted data recovered from SCP-003-2 may refer to a past and/or potential future LK-class restructuring event caused by SCP-003-1.'),
  (6, 'SCP-003 was located by remote viewing team SRV-04 Beta. It appears possible that SRV-04 Beta was deliberately contacted by SCP-003-2. Other organizations have also been alerted to SCP-003''s existence, possibly by similar means. Despite this activity, SCP-003-2 does not appear to be sentient, based on its lack of reaction to M03-Gloria analysis and procedures.'),
  (7, 'When SCP-003 drops below the temperature of 35°C, both components react. First, SCP-003-1 enters a growth state characterized by an exponential increase in mass, partially fueled by converting surrounding inorganic and nonliving organic matter. During each growth stage, SCP-003-2 releases bursts of radiation that temporarily inhibit or reverse SCP-003-1''s growth.')
) as v(position, body);

-- Addenda (author_id NULL: original file content, not written by a user).
-- created_at is staggered by position so they display in their original order.
insert into public.addenda (subject_id, author_id, title, body, created_at)
select (select id from public.scp_subjects where item = 'SCP-003'), null, v.title, v.body, now() + v.position * interval '1 second'
from (values
  (1, 'Addendum 003-01', 'Acting on information gathered from linguistic analysis of SCP-003-2''s runes and comparative data analysis, Research Team M03-Gloria has managed to establish a link between SCP-003 and [DATA REDACTED] for analysis of functions. SCP-003-1 must now be considered sentient, and is to be kept a minimum of 1 km from [DATA REDACTED] and the resulting "by-product" at all times.'),
  (2, 'Addendum 003-02', 'SCP-003-2''s power loss has been exacerbated by the procedures performed by M03-Gloria. On orders of O5-10, M03-Gloria will continue procedures.'),
  (3, 'Addendum 003-03', 'During M03-Gloria procedures, SCP-003-1 doubled its mass and began rapid structural growth. Temperature was immediately returned to 100°C. Growth continued for 9 minutes and 6 seconds, at which time a sustained radiation spike was produced by SCP-003-2. SCP-003-1 returned to its normal state in 3 minutes and 39 seconds. Both SCP-003-1 and SCP-003-2 ceased all detectable activity until reconnected to external power.'),
  (4, 'Addendum 003-04', 'The procedure detailed in Addendum 003-03 was repeated. SCP-003-1 breached containment, entering the observation gallery where nine members of M03-Gloria were present, and rearranged itself into a three-metre-tall humanoid form before attempting rudimentary vocal communication. [DATA REDACTED] Agent Jackson of M03-Gloria successfully restored power and SCP-003-1 was re-contained without further incident.'),
  (5, 'Addendum 003-05', 'In light of the previous incident, O5-10 was removed from the O5 Council by joint decision of O5-[DATA REDACTED], O5-[DATA REDACTED], and O5-[DATA REDACTED]. M03-Gloria procedures have been indefinitely suspended.')
) as v(position, title, body);

-- ---------------------------------------------------------------------
-- SCP-004 (Euclid)
-- ---------------------------------------------------------------------
insert into public.scp_subjects (item, object_class_id, summary, image_url, image_alt, owner_id)
values (
  'SCP-004',
  (select id from public.object_classes where name = 'Euclid'),
  'An anomalous barn door and twelve keys granting access to unstable extradimensional space, most fatal to those who enter.',
  'https://cpubzanyrlsbmqasawdm.supabase.co/storage/v1/object/public/scp-images/seed/scp-004.jpg',
  'SCP-004 anomalous door and key access point',
  null
);

-- Special Containment Procedures
insert into public.containment_procedures (subject_id, position, body)
select (select id from public.scp_subjects where item = 'SCP-004'), v.position, v.body
from (values
  (1, 'When handling items SCP-004-2 through SCP-004-13, proper procedure is vital. The items are not permitted to be moved off-site unless accompanied by two Level 4 security personnel. Under no circumstances should any other component of SCP-004 be taken through SCP-004-1. Should any of the objects contained within SCP-004-1 breach containment, or the facility be breached, the keys must be brought inside and the door closed prior to activation of Site 62''s on-site warhead. Unauthorized removal of keys from the testing area is grounds for immediate termination.'),
  (2, 'Level 1 clearance is required for basic access to SCP-004-1; Level 4 clearance is required for use of SCP-004-2 to -13.')
) as v(position, body);

-- Description
insert into public.descriptions (subject_id, position, body)
select (select id from public.scp_subjects where item = 'SCP-004'), v.position, v.body
from (values
  (1, 'SCP-004 consists of an old wooden barn door (SCP-004-1) and a set of twelve rusted steel keys (SCP-004-2 through SCP-004-13). The door itself is the entrance to an abandoned factory in [DATA REDACTED].'),
  (2, 'Testing on SCP-004 reveals that ten of the keys open SCP-004-1 on a dimension where the laws of physics and topology are significantly different than those of our home dimension. Test subjects meeting these hostile conditions are torn apart, their body parts deposited in various locations, only three of which have been verified to be on Earth.'),
  (3, 'SCP-004 seems to propagate spatiotemporal anomalies. Personnel leaving the facility report losing time, and records of work completed and supplies consumed support their claims.')
) as v(position, body);

-- Reference
insert into public.subject_references (subject_id, position, body)
select (select id from public.scp_subjects where item = 'SCP-004'), v.position, v.body
from (values
  (1, 'All Class D personnel using SCP-004-12 return in a catatonic state, unable to speak. Of sixteen subjects, only four have survived, and only one regained speech following long-term psychotherapy, describing a massive green creature so large that much of its body extended beyond his field of view.')
) as v(position, body);

-- Chronology (source dates are US-style MM/DD/YYYY, e.g. 09/25/2000;
-- to_date converts them to the date type)
insert into public.chronology_entries (subject_id, position, event_date, body)
select (select id from public.scp_subjects where item = 'SCP-004'), v.position, to_date(v.event_date, 'MM/DD/YYYY'), v.body
from (values
  (1, '07/02/1949', 'A group of three juveniles trespassing on federal property find the door and a set of rusted keys in an iron lockbox. One of their friends (SCP-004-CAS01) goes missing after the door is opened.'),
  (2, '07/03/1949', 'The severed remains of SCP-004-CAS01 are found scattered up to 32 km from the factory. The SCP Foundation takes over the investigation.'),
  (3, '07/04/1949', 'Twelve Class D personnel each test a different key. Of the twelve, only two survive — one (SCP-004-7) returns unharmed, the other in a near-catatonic state.'),
  (4, '09/25/2000', 'Site-62 becomes operational, built around SCP-004-1 to house emergency SCP storage and a backup of the SCP database.'),
  (5, '08/14/2003', 'A regional power outage leaves Site-62 without light for fifty-three minutes; personnel report sensing unseen, humanoid-sized entities.')
) as v(position, event_date, body);

-- ---------------------------------------------------------------------
-- SCP-005 (Safe)
-- ---------------------------------------------------------------------
insert into public.scp_subjects (item, object_class_id, summary, image_url, image_alt, owner_id)
values (
  'SCP-005',
  (select id from public.object_classes where name = 'Safe'),
  'An ornate key with the anomalous ability to open nearly any lock, mechanical or digital.',
  'https://cpubzanyrlsbmqasawdm.supabase.co/storage/v1/object/public/scp-images/seed/scp-005.png',
  'SCP-005 ornate universal key',
  null
);

-- Special Containment Procedures
insert into public.containment_procedures (subject_id, position, body)
select (select id from public.scp_subjects where item = 'SCP-005'), v.position, v.body
from (values
  (1, 'SCP-005 poses no immediate risk in any direct sense. Even so, its unique functions require special measures be taken to restrict access and manipulation of the object. Approval of at least one (1) Level 4 personnel is required for the removal of the object from its containment area.')
) as v(position, body);

-- Description
insert into public.descriptions (subject_id, position, body)
select (select id from public.scp_subjects where item = 'SCP-005'), v.position, v.body
from (values
  (1, 'In appearance, SCP-005 resembles an ornate key, displaying the characteristics of a typical mass produced key used in the 1920s. The key was discovered when a civilian used it to infiltrate a high security facility. SCP-005 seems to have the unique ability to open any and all forms of lock, be they mechanical or digital, with relative ease. The origin of this ability has yet to be determined.')
) as v(position, body);

-- Additional Notes
insert into public.additional_notes (subject_id, position, body)
select (select id from public.scp_subjects where item = 'SCP-005'), v.position, v.body
from (values
  (1, 'SCP-005 may be used as a replacement for lost security passes, but only under the supervision of at least one (1) Level 4 personnel. SCP-005 may not be used for vending machine repairs, opening lockers, or for any personnel''s spare home key. Removal of the object from the compound will result in immediate termination.')
) as v(position, body);

-- Appendix
insert into public.appendices (subject_id, title, body)
values ((select id from public.scp_subjects where item = 'SCP-005'), 'Appendix A', 'While SCP-005 has been shown to be effective in removing almost any form of locking device, further experiments have shown that efforts to disguise the purpose or identity of a lock have proven at least somewhat successful in defeating SCP-005''s ability. In approximately 50% of cases where a volunteer was not able to identify a locking device as such, SCP-005 was not successful in deactivating the device. Due to these results, SCP-005 has been tentatively classified as ''sentient'' and further tests are being run to determine its cognitive abilities.');

-- ---------------------------------------------------------------------
-- SCP-006 (Safe)
-- ---------------------------------------------------------------------
insert into public.scp_subjects (item, object_class_id, summary, image_url, image_alt, owner_id)
values (
  'SCP-006',
  (select id from public.object_classes where name = 'Safe'),
  'A small spring whose water grants extreme regenerative and immune-enhancing effects in humans.',
  'https://cpubzanyrlsbmqasawdm.supabase.co/storage/v1/object/public/scp-images/seed/scp-006.jpg',
  'SCP-006 spring water source',
  null
);

-- Special Containment Procedures
insert into public.containment_procedures (subject_id, position, body)
select (select id from public.scp_subjects where item = 'SCP-006'), v.position, v.body
from (values
  (1, 'Whereas the nature of SCP-006 does not warrant any extensive containment, a certain level of secrecy is necessary regarding the object''s existence and properties. The following procedures are required not for personnel safety, but to deny or hide knowledge of SCP-006''s effects from the personnel who interact with it.'),
  (2, 'All personnel interacting with SCP-006 in any physical way are required to wear modified Class VI BNC suits and be briefed with the correct clearance-restricted material before performing procedures.'),
  (3, 'Procedures with SCP-006 are to be carried out under extreme surveillance. In case of contact with SCP-006, the commander in charge will announce Procedure 006-Xi-12, briefed to personnel as meaning high toxicity is present and requiring evacuation.'),
  (4, 'Any procedure in which liquid is acquired from SCP-006 must be approved by three (3) O5 level personnel, and transferred in a Quad-Sealant Container under armed guard.'),
  (5, 'If at any time personnel come into contact with SCP-006 or liquid from SCP-006, they are to be confined and terminated after sufficient studies are done, most effectively by incineration.')
) as v(position, body);

-- Description
insert into public.descriptions (subject_id, position, body)
select (select id from public.scp_subjects where item = 'SCP-006'), v.position, v.body
from (values
  (1, 'SCP-006 is a very small spring located 60 km west of Astrakhan. Foundation Command was aware of its existence since the 19th century, but were unable to secure it until 1991 due to political reasons. On the spot of the spring, a chemical factory has been constructed as a disguise. The liquid emitted from the spring has been chemically identified as simple mineral water, but has the unusual property of "health".'),
  (2, 'Ingesting the liquid produces the following properties in human beings: the ability to regenerate DNA damaged by sufficient duplication, heightened excitement of cellular duplication, vastly improved abilities in the repair of damaged tissue, and a marked increase in the effectiveness of the human immune system. Many reptiles and birds were unaffected by the liquid, while higher primates experienced the same benefits as humans.')
) as v(position, body);

commit;

-- ---------------------------------------------------------------------
-- Check: select and run this query on its own afterwards (remove the --).
-- Expected result, one row per subject:
--
--   item     class   containment description reference notes chronology field_report_entries addenda
--   SCP-002  Euclid       3          2           1       0        0              6              0
--   SCP-003  Euclid       4          7           0       0        0              0              5
--   SCP-004  Euclid       2          3           1       0        5              0              0
--   SCP-005  Safe         1          1           0       1        0              0              0
--   SCP-006  Safe         5          2           0       0        0              0              0
-- ---------------------------------------------------------------------
-- select s.item,
--        c.name as class,
--        (select count(*) from public.containment_procedures x where x.subject_id = s.id) as containment,
--        (select count(*) from public.descriptions x where x.subject_id = s.id) as description,
--        (select count(*) from public.subject_references x where x.subject_id = s.id) as reference,
--        (select count(*) from public.additional_notes x where x.subject_id = s.id) as notes,
--        (select count(*) from public.chronology_entries x where x.subject_id = s.id) as chronology,
--        (select count(*) from public.field_report_entries x
--           join public.field_reports f on f.id = x.field_report_id
--          where f.subject_id = s.id) as field_report_entries,
--        (select count(*) from public.addenda x where x.subject_id = s.id) as addenda
-- from public.scp_subjects s
-- join public.object_classes c on c.id = s.object_class_id
-- order by s.item;
