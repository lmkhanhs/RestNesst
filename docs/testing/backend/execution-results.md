# Kết quả triển khai và chạy đặc tả backend

Lần chạy: **2026-11-10 11:19:13 +07**.

Có code gắn ID: **79/79**. Kết quả thực thi: **48 Pass, 26 Fail, 1 Error, 4 Skipped, 0 Not Run**.

Hoàn thành đúng mức kiểm thử trong đặc tả: **17/17 unit**. **0/62 integration được nghiệm thu đầy đủ trên MySQL/Redis thật**; kết quả integration dưới đây là bằng chứng một phần trên H2 và blacklist double.

## Môi trường và cách tính

- Môi trường lần chạy: `Apache Maven 3.9.16 (2bdd9fddda4b155ebf8000e807eb73fd829a51d5)`, `Java version: 21.0.10`. Project giữ nguyên Java target 17; chỉ chứng minh trên JVM được ghi ở đây.
- Unit: repository/password doubles, mapper thật khi đặc tả yêu cầu; xác minh chữ ký JWT thật.
- Integration cục bộ: MockMvc qua SecurityFilterChain, CustomJwtDecoder, method security, controller/service/mapper thật, JPA và transaction thật; H2 in-memory riêng, BCrypt thật (cost 4), blacklist giả lập. Không nạp application.yml, seed startup hay kết nối DB/Redis dev.
- Mỗi ID được tính một lần; nhiều biến thể trong một ID không làm tăng tổng 79. Một biến thể lỗi làm ca lỗi. Skipped có thể đã chạy một phần nhưng còn thiếu oracle/biên dữ liệu.
- `proposal`: assertion dựa trên tiêu chí [ĐX]/Q chưa phê duyệt. Fail thể hiện lệch đề xuất, chưa phải kết luận Fail nghiệp vụ đã chốt. Các ca này chỉ chạy trong profile chủ động, không thuộc `mvn test` mặc định.
- `observation`: chỉ ghi nhận hành vi/invariant hiện tại; chưa nghiệm thu chính sách còn mở. H2 không chứng minh SQL/locking/constraint MySQL hoặc Redis TTL/thất bại kết nối.
- Error ở JWT filter ghi nhận exception thoát khỏi filter; MockMvc không chứng minh response 500 của servlet container thật.
- Các số liệu này phản ánh lần chạy trên, không đồng nghĩa phần trăm hoàn thành tính năng backend.

## Điểm cần xử lý sau lần chạy

Đọc trạng thái từng ID bên dưới để biết điểm nào tái hiện trong lần chạy này. Những nhóm cần chú ý:

- HOST-IT-004: kiểm tra việc caller gửi đơn cho user khác (Q-H02).
- BOOK-IT-007..016, BOOK-IT-019 và BOOK-IT-023: validation ngày/giá, khả dụng, overlap, đồng thời, tài khoản khóa và retry; chính sách [ĐX]/Q cần xác nhận trước khi sửa nghiệp vụ.
- AUTH-IT-012 / BOOK-IT-003: exception JWT invalid/refresh/blacklist có thể thoát khỏi filter; cần hợp đồng HTTP thống nhất (Q-G01).
- AUTH-IT-014 / HOST-IT-024 / BOOK-IT-022: phân biệt rollback dữ liệu với HTTP lỗi; BookingService hiện có @Transactional cấp class, không suy từ mô tả source cũ rằng thiếu transaction.
- AUTH-IT-009, HOST-IT-025, BOOK-IT-018 và BOOK-IT-020 còn thiếu giới hạn/oracle dù đã có code kiểm tra một phần.

## Theo chức năng

| Chức năng | Có code | Pass | Fail | Error | Skipped | Not Run |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| Đăng nhập | 19 | 13 | 4 | 1 | 1 | 0 |
| Yêu cầu host | 32 | 25 | 6 | 0 | 1 | 0 |
| Tạo booking | 28 | 10 | 16 | 0 | 2 | 0 |

## Truy vết từng test case

| ID / đặc tả | Kết quả chạy | Loại kỳ vọng | Code | Chi tiết |
| --- | --- | --- | --- | --- |
| [AUTH-UT-001](01-auth-login.md) | Pass | Unit | [AUTH_UT_001_validLoginSavesOnlyCurrentUser](../../../airbnb_service/src/test/java/com/pbl5cnpm/airbnb_service/auth/service/AuthLoginSpecTest.java) |  |
| [AUTH-UT-002](01-auth-login.md) | Pass | Unit | [AUTH_UT_002_wrongPasswordDoesNotMutateUser](../../../airbnb_service/src/test/java/com/pbl5cnpm/airbnb_service/auth/service/AuthLoginSpecTest.java) |  |
| [AUTH-UT-003](01-auth-login.md) | Pass | Unit | [AUTH_UT_003_lockedAccountDoesNotCheckPassword](../../../airbnb_service/src/test/java/com/pbl5cnpm/airbnb_service/auth/service/AuthLoginSpecTest.java) |  |
| [AUTH-UT-004](01-auth-login.md) | Pass | Unit | [AUTH_UT_004_verifiesBothJwtSignaturesAndClaims](../../../airbnb_service/src/test/java/com/pbl5cnpm/airbnb_service/auth/service/AuthLoginSpecTest.java) |  |
| [AUTH-UT-005](01-auth-login.md) | Pass | Unit | [AUTH_UT_005_saveFailureDoesNotReturnTokens](../../../airbnb_service/src/test/java/com/pbl5cnpm/airbnb_service/auth/service/AuthLoginSpecTest.java) |  |
| [AUTH-IT-001](01-auth-login.md) | Pass | [CODE]/hợp đồng | [AUTH_IT_001_loginPersistsLastLoginAndDoesNotChangeOtherTables](../../../airbnb_service/src/test/java/com/pbl5cnpm/airbnb_service/spec/AuthLoginAcceptanceIT.java) |  |
| [AUTH-IT-002](01-auth-login.md) | Pass | [CODE]/hợp đồng | [AUTH_IT_002_wrongPasswordIsUnauthorizedWithoutMutation](../../../airbnb_service/src/test/java/com/pbl5cnpm/airbnb_service/spec/AuthLoginAcceptanceIT.java) |  |
| [AUTH-IT-003](01-auth-login.md) | Fail | proposal | [AUTH_IT_003_missingUsernameMustNotDiscloseAccountExistence](../../../airbnb_service/src/test/java/com/pbl5cnpm/airbnb_service/spec/AuthLoginAcceptanceIT.java) | HTTP status ==> expected: <401> but was: <500> |
| [AUTH-IT-004](01-auth-login.md) | Pass | [CODE]/hợp đồng | [AUTH_IT_004_lockedAccountDoesNotReceiveToken](../../../airbnb_service/src/test/java/com/pbl5cnpm/airbnb_service/spec/AuthLoginAcceptanceIT.java) |  |
| [AUTH-IT-005](01-auth-login.md) | Fail | proposal | [AUTH_IT_005_missingAndNullCredentialsAreValidationErrors](../../../airbnb_service/src/test/java/com/pbl5cnpm/airbnb_service/spec/AuthLoginAcceptanceIT.java) | Multiple Failures (2 failures) org.opentest4j.AssertionFailedError: expected: <400> but was: <500> org.opentest4j.AssertionFailedError: expected: <400> but was: <500> |
| [AUTH-IT-006](01-auth-login.md) | Fail | proposal | [AUTH_IT_006_blankAndWhitespaceCredentialsAreValidationErrors](../../../airbnb_service/src/test/java/com/pbl5cnpm/airbnb_service/spec/AuthLoginAcceptanceIT.java) | Multiple Failures (4 failures) org.opentest4j.AssertionFailedError: expected: <400> but was: <500> org.opentest4j.AssertionFailedError: expected: <400> but was: <500> org.opentest4j.AssertionFailedError: expected: <400> but was: <401> org.opentest4j. |
| [AUTH-IT-007](01-auth-login.md) | Pass | [CODE]/hợp đồng | [AUTH_IT_007_passwordWhitespaceIsSignificant](../../../airbnb_service/src/test/java/com/pbl5cnpm/airbnb_service/spec/AuthLoginAcceptanceIT.java) |  |
| [AUTH-IT-008](01-auth-login.md) | Pass | [CODE]/hợp đồng | [AUTH_IT_008_malformedOrEmptyJsonDoesNotWriteData](../../../airbnb_service/src/test/java/com/pbl5cnpm/airbnb_service/spec/AuthLoginAcceptanceIT.java) |  |
| [AUTH-IT-009](01-auth-login.md) | Skipped | proposal | [AUTH_IT_009_wrongCredentialTypesAndUnspecifiedLengthLimits](../../../airbnb_service/src/test/java/com/pbl5cnpm/airbnb_service/spec/AuthLoginAcceptanceIT.java) | Q-A02: đã kiểm tra sai kiểu; chưa có Umax/Pmax để kiểm tra biên độ dài. |
| [AUTH-IT-010](01-auth-login.md) | Pass | [CODE]/hợp đồng | [AUTH_IT_010_tokensUseDatabaseRolesAndIgnoreClientRoleInjection](../../../airbnb_service/src/test/java/com/pbl5cnpm/airbnb_service/spec/AuthLoginAcceptanceIT.java) |  |
| [AUTH-IT-011](01-auth-login.md) | Pass | [CODE]/hợp đồng | [AUTH_IT_011_loginAccessTokenWorksOnProtectedProfileEndpoint](../../../airbnb_service/src/test/java/com/pbl5cnpm/airbnb_service/spec/AuthLoginAcceptanceIT.java) |  |
| [AUTH-IT-012](01-auth-login.md) | Error | proposal | [AUTH_IT_012_refreshTokenCannotAuthenticateProtectedEndpoint](../../../airbnb_service/src/test/java/com/pbl5cnpm/airbnb_service/spec/AuthLoginAcceptanceIT.java) | unauthenticated! \|\| token is invalid |
| [AUTH-IT-013](01-auth-login.md) | Pass | [CODE]/hợp đồng | [AUTH_IT_013_introspectionExpiryBoundaryAndRevocation](../../../airbnb_service/src/test/java/com/pbl5cnpm/airbnb_service/spec/AuthLoginAcceptanceIT.java) |  |
| [AUTH-IT-014](01-auth-login.md) | Fail | proposal | [AUTH_IT_014_failedLastLoginWriteDoesNotReturnTokens](../../../airbnb_service/src/test/java/com/pbl5cnpm/airbnb_service/spec/AuthLoginAcceptanceIT.java) | Q-A06: proposed controlled 5xx ==> expected: <true> but was: <false> |
| [HOST-UT-001](02-host-application.md) | Pass | Unit | [HOST_UT_001_applicationUpdatesOnlyApplicantWithoutGrantingHost](../../../airbnb_service/src/test/java/com/pbl5cnpm/airbnb_service/user/service/HostApplicationSpecTest.java) |  |
| [HOST-UT-002](02-host-application.md) | Pass | Unit | [HOST_UT_002_existingHostIsRejectedBeforeCountryOrLanguageLookup](../../../airbnb_service/src/test/java/com/pbl5cnpm/airbnb_service/user/service/HostApplicationSpecTest.java) |  |
| [HOST-UT-003](02-host-application.md) | Pass | Unit | [HOST_UT_003_experienceNormalizationIncludesNumericTextAndCalendarBoundaries](../../../airbnb_service/src/test/java/com/pbl5cnpm/airbnb_service/user/service/HostApplicationSpecTest.java) |  |
| [HOST-UT-004](02-host-application.md) | Pass | Unit | [HOST_UT_004_deduplicatesLanguageIdsAndRejectsMissingDeletedOrInactive](../../../airbnb_service/src/test/java/com/pbl5cnpm/airbnb_service/user/service/HostApplicationSpecTest.java) |  |
| [HOST-UT-005](02-host-application.md) | Pass | Unit | [HOST_UT_005_cannotApproveUserWithoutPendingApplication](../../../airbnb_service/src/test/java/com/pbl5cnpm/airbnb_service/user/service/HostApplicationSpecTest.java) |  |
| [HOST-UT-006](02-host-application.md) | Pass | Unit | [HOST_UT_006_approvalAddsHostWhileRejectionPreservesExistingHostRole](../../../airbnb_service/src/test/java/com/pbl5cnpm/airbnb_service/user/service/HostApplicationSpecTest.java) |  |
| [HOST-UT-007](02-host-application.md) | Pass | Unit | [HOST_UT_007_realMapperDoesNotExposeCredentialsOrInternalFlags](../../../airbnb_service/src/test/java/com/pbl5cnpm/airbnb_service/user/service/HostApplicationSpecTest.java) |  |
| [HOST-IT-001](02-host-application.md) | Pass | [CODE]/hợp đồng | [HOST_IT_001_validApplicationPersistsProfileAndLanguages](../../../airbnb_service/src/test/java/com/pbl5cnpm/airbnb_service/spec/HostApplicationAcceptanceIT.java) |  |
| [HOST-IT-002](02-host-application.md) | Pass | [CODE]/hợp đồng | [HOST_IT_002_repeatApplicationUpdatesSameUser](../../../airbnb_service/src/test/java/com/pbl5cnpm/airbnb_service/spec/HostApplicationAcceptanceIT.java) |  |
| [HOST-IT-003](02-host-application.md) | Pass | [CODE]/hợp đồng | [HOST_IT_003_anonymousCannotApply](../../../airbnb_service/src/test/java/com/pbl5cnpm/airbnb_service/spec/HostApplicationAcceptanceIT.java) |  |
| [HOST-IT-004](02-host-application.md) | Fail | proposal | [HOST_IT_004_cannotApplyForAnotherUser](../../../airbnb_service/src/test/java/com/pbl5cnpm/airbnb_service/spec/HostApplicationAcceptanceIT.java) | Multiple Failures (2 failures) org.opentest4j.AssertionFailedError: expected: <403> but was: <200> org.opentest4j.AssertionFailedError: other user's profile must not change ==> expected: <{"id":242,"fullname":"QA original","description":"QA original  |
| [HOST-IT-005](02-host-application.md) | Fail | proposal | [HOST_IT_005_missingNullZeroNegativeAndWrongTypeUserId](../../../airbnb_service/src/test/java/com/pbl5cnpm/airbnb_service/spec/HostApplicationAcceptanceIT.java) | Multiple Failures (2 failures) org.opentest4j.AssertionFailedError: zero ==> expected: <400> but was: <500> org.opentest4j.AssertionFailedError: negative ==> expected: <400> but was: <500> |
| [HOST-IT-006](02-host-application.md) | Pass | [CODE]/hợp đồng | [HOST_IT_006_countryValidationAndTrimming](../../../airbnb_service/src/test/java/com/pbl5cnpm/airbnb_service/spec/HostApplicationAcceptanceIT.java) |  |
| [HOST-IT-007](02-host-application.md) | Pass | [CODE]/hợp đồng | [HOST_IT_007_invalidLanguagesRollBackEarlierProfileChanges](../../../airbnb_service/src/test/java/com/pbl5cnpm/airbnb_service/spec/HostApplicationAcceptanceIT.java) |  |
| [HOST-IT-008](02-host-application.md) | Pass | [CODE]/hợp đồng | [HOST_IT_008_languageIdsAreDeduplicatedAndOverrideFreeText](../../../airbnb_service/src/test/java/com/pbl5cnpm/airbnb_service/spec/HostApplicationAcceptanceIT.java) |  |
| [HOST-IT-009](02-host-application.md) | Fail | proposal | [HOST_IT_009_requiredProfileFieldsAndUnspecifiedLengthLimits](../../../airbnb_service/src/test/java/com/pbl5cnpm/airbnb_service/spec/HostApplicationAcceptanceIT.java) | Multiple Failures (7 failures) org.opentest4j.MultipleFailuresError: Multiple Failures (2 failures) org.opentest4j.AssertionFailedError: fullname ==> expected: <400> but was: <200> org.opentest4j.AssertionFailedError: expected: <{"id":139,"fullname": |
| [HOST-IT-010](02-host-application.md) | Pass | [CODE]/hợp đồng | [HOST_IT_010_existingHostCannotApplyAgain](../../../airbnb_service/src/test/java/com/pbl5cnpm/airbnb_service/spec/HostApplicationAcceptanceIT.java) |  |
| [HOST-IT-011](02-host-application.md) | Pass | [CODE]/hợp đồng | [HOST_IT_011_adminListsOnlyPendingApplicationsWithoutCredentials](../../../airbnb_service/src/test/java/com/pbl5cnpm/airbnb_service/spec/HostApplicationAcceptanceIT.java) |  |
| [HOST-IT-012](02-host-application.md) | Pass | [CODE]/hợp đồng | [HOST_IT_012_emptyPendingListIsArray](../../../airbnb_service/src/test/java/com/pbl5cnpm/airbnb_service/spec/HostApplicationAcceptanceIT.java) |  |
| [HOST-IT-013](02-host-application.md) | Pass | [CODE]/hợp đồng | [HOST_IT_013_guestAndHostCannotListApplications](../../../airbnb_service/src/test/java/com/pbl5cnpm/airbnb_service/spec/HostApplicationAcceptanceIT.java) |  |
| [HOST-IT-014](02-host-application.md) | Fail | proposal | [HOST_IT_014_anonymousCannotListApplications](../../../airbnb_service/src/test/java/com/pbl5cnpm/airbnb_service/spec/HostApplicationAcceptanceIT.java) | HTTP status ==> expected: <401> but was: <403> |
| [HOST-IT-015](02-host-application.md) | Pass | [CODE]/hợp đồng | [HOST_IT_015_approvalCommitsHostRoleAndClearsPendingTogether](../../../airbnb_service/src/test/java/com/pbl5cnpm/airbnb_service/spec/HostApplicationAcceptanceIT.java) |  |
| [HOST-IT-016](02-host-application.md) | Pass | [CODE]/hợp đồng | [HOST_IT_016_approvalWithoutApplicationIsRejected](../../../airbnb_service/src/test/java/com/pbl5cnpm/airbnb_service/spec/HostApplicationAcceptanceIT.java) |  |
| [HOST-IT-017](02-host-application.md) | Pass | [CODE]/hợp đồng | [HOST_IT_017_repeatedApprovalDoesNotDuplicateRole](../../../airbnb_service/src/test/java/com/pbl5cnpm/airbnb_service/spec/HostApplicationAcceptanceIT.java) |  |
| [HOST-IT-018](02-host-application.md) | Pass | [CODE]/hợp đồng | [HOST_IT_018_nonAdminsCannotApprove](../../../airbnb_service/src/test/java/com/pbl5cnpm/airbnb_service/spec/HostApplicationAcceptanceIT.java) |  |
| [HOST-IT-019](02-host-application.md) | Pass | [CODE]/hợp đồng | [HOST_IT_019_anonymousCannotApproveOrReject](../../../airbnb_service/src/test/java/com/pbl5cnpm/airbnb_service/spec/HostApplicationAcceptanceIT.java) |  |
| [HOST-IT-020](02-host-application.md) | Pass | [CODE]/hợp đồng | [HOST_IT_020_rejectionPreservesProfileLanguagesAndGuestRole](../../../airbnb_service/src/test/java/com/pbl5cnpm/airbnb_service/spec/HostApplicationAcceptanceIT.java) |  |
| [HOST-IT-021](02-host-application.md) | Pass | [CODE]/hợp đồng | [HOST_IT_021_nonAdminsCannotReject](../../../airbnb_service/src/test/java/com/pbl5cnpm/airbnb_service/spec/HostApplicationAcceptanceIT.java) |  |
| [HOST-IT-022](02-host-application.md) | Pass | [CODE]/hợp đồng | [HOST_IT_022_canApplyAgainAfterRejection](../../../airbnb_service/src/test/java/com/pbl5cnpm/airbnb_service/spec/HostApplicationAcceptanceIT.java) |  |
| [HOST-IT-023](02-host-application.md) | Fail | proposal | [HOST_IT_023_missingUserAndMissingHostRoleDoNotMutateApplicant](../../../airbnb_service/src/test/java/com/pbl5cnpm/airbnb_service/spec/HostApplicationAcceptanceIT.java) | Multiple Failures (1 failure) org.opentest4j.AssertionFailedError: Q-H06 proposed 404 ==> expected: <404> but was: <500> |
| [HOST-IT-024](02-host-application.md) | Fail | proposal | [HOST_IT_024_commitFailureRollsBackRoleAndPending](../../../airbnb_service/src/test/java/com/pbl5cnpm/airbnb_service/spec/HostApplicationAcceptanceIT.java) | proposed controlled 5xx ==> expected: <true> but was: <false> |
| [HOST-IT-025](02-host-application.md) | Skipped | observation | [HOST_IT_025_concurrentApprovalAndRejectionPreserveRoleUniqueness](../../../airbnb_service/src/test/java/com/pbl5cnpm/airbnb_service/spec/HostApplicationAcceptanceIT.java) | Q-H08: đã chạy đồng thời và kiểm tra invariant; chưa có oracle thắng/thua, cần MySQL thật. |
| [BOOK-UT-001](03-create-booking.md) | Pass | Unit | [BOOK_UT_001_assignsPrincipalAndInitialStateBeforeSaving](../../../airbnb_service/src/test/java/com/pbl5cnpm/airbnb_service/booking/service/CreateBookingSpecTest.java) |  |
| [BOOK-UT-002](03-create-booking.md) | Pass | Unit | [BOOK_UT_002_realMapperRejectsMissingListing](../../../airbnb_service/src/test/java/com/pbl5cnpm/airbnb_service/booking/service/CreateBookingSpecTest.java) |  |
| [BOOK-UT-003](03-create-booking.md) | Pass | Unit | [BOOK_UT_003_realResponseMapperHandlesNullEmptyAndSingleImage](../../../airbnb_service/src/test/java/com/pbl5cnpm/airbnb_service/booking/service/CreateBookingSpecTest.java) |  |
| [BOOK-UT-004](03-create-booking.md) | Pass | Unit | [BOOK_UT_004_saveFailureDoesNotMapSuccessOrUpdateListing](../../../airbnb_service/src/test/java/com/pbl5cnpm/airbnb_service/booking/service/CreateBookingSpecTest.java) |  |
| [BOOK-UT-005](03-create-booking.md) | Pass | Unit | [BOOK_UT_005_controllerPassesUsernameFromSecurityContext](../../../airbnb_service/src/test/java/com/pbl5cnpm/airbnb_service/booking/service/CreateBookingSpecTest.java) |  |
| [BOOK-IT-001](03-create-booking.md) | Pass | [CODE]/hợp đồng | [BOOK_IT_001_validBookingResponseMatchesCommittedData](../../../airbnb_service/src/test/java/com/pbl5cnpm/airbnb_service/spec/CreateBookingAcceptanceIT.java) |  |
| [BOOK-IT-002](03-create-booking.md) | Pass | [CODE]/hợp đồng | [BOOK_IT_002_anonymousCannotCreateBooking](../../../airbnb_service/src/test/java/com/pbl5cnpm/airbnb_service/spec/CreateBookingAcceptanceIT.java) |  |
| [BOOK-IT-003](03-create-booking.md) | Fail | proposal | [BOOK_IT_003_expiredTamperedRevokedAndRefreshTokensCannotBook](../../../airbnb_service/src/test/java/com/pbl5cnpm/airbnb_service/spec/CreateBookingAcceptanceIT.java) | Multiple Failures (4 failures) com.pbl5cnpm.airbnb_service.shared.exception.AppException: unauthenticated! \|\| token is invalid java.lang.IllegalStateException: The JWS object must be in an unsigned state com.pbl5cnpm.airbnb_service.shared.exception.A |
| [BOOK-IT-004](03-create-booking.md) | Pass | [CODE]/hợp đồng | [BOOK_IT_004_clientCannotOverrideOwnerStatusOrFlags](../../../airbnb_service/src/test/java/com/pbl5cnpm/airbnb_service/spec/CreateBookingAcceptanceIT.java) |  |
| [BOOK-IT-005](03-create-booking.md) | Fail | proposal | [BOOK_IT_005_missingListingReturnsNotFound](../../../airbnb_service/src/test/java/com/pbl5cnpm/airbnb_service/spec/CreateBookingAcceptanceIT.java) | Multiple Failures (1 failure) org.opentest4j.AssertionFailedError: expected: <404> but was: <500> |
| [BOOK-IT-006](03-create-booking.md) | Fail | proposal | [BOOK_IT_006_invalidListingIdsAreValidationErrors](../../../airbnb_service/src/test/java/com/pbl5cnpm/airbnb_service/spec/CreateBookingAcceptanceIT.java) | Multiple Failures (2 failures) org.opentest4j.MultipleFailuresError: Multiple Failures (1 failure) org.opentest4j.AssertionFailedError: expected: <400> but was: <500> org.opentest4j.MultipleFailuresError: Multiple Failures (1 failure) org.opentest4j. |
| [BOOK-IT-007](03-create-booking.md) | Fail | proposal | [BOOK_IT_007_missingOrNullDatesDoNotCreateBooking](../../../airbnb_service/src/test/java/com/pbl5cnpm/airbnb_service/spec/CreateBookingAcceptanceIT.java) | Multiple Failures (3 failures) org.opentest4j.MultipleFailuresError: Multiple Failures (2 failures) org.opentest4j.AssertionFailedError: expected: <400> but was: <200> org.opentest4j.AssertionFailedError: no booking should have been committed ==> exp |
| [BOOK-IT-008](03-create-booking.md) | Fail | proposal | [BOOK_IT_008_zeroOrNegativeNightsAreRejected](../../../airbnb_service/src/test/java/com/pbl5cnpm/airbnb_service/spec/CreateBookingAcceptanceIT.java) | Multiple Failures (2 failures) org.opentest4j.MultipleFailuresError: Multiple Failures (2 failures) org.opentest4j.AssertionFailedError: expected: <400> but was: <200> org.opentest4j.AssertionFailedError: no booking should have been committed ==> exp |
| [BOOK-IT-009](03-create-booking.md) | Fail | proposal | [BOOK_IT_009_pastTodayAndOneNightBoundaries](../../../airbnb_service/src/test/java/com/pbl5cnpm/airbnb_service/spec/CreateBookingAcceptanceIT.java) | Multiple Failures (1 failure) org.opentest4j.MultipleFailuresError: Multiple Failures (2 failures) org.opentest4j.AssertionFailedError: expected: <400> but was: <200> org.opentest4j.AssertionFailedError: no booking should have been committed ==> expe |
| [BOOK-IT-010](03-create-booking.md) | Pass | proposal | [BOOK_IT_010_invalidDatesAndLeapYearRoundTrip](../../../airbnb_service/src/test/java/com/pbl5cnpm/airbnb_service/spec/CreateBookingAcceptanceIT.java) |  |
| [BOOK-IT-011](03-create-booking.md) | Fail | proposal | [BOOK_IT_011_nullZeroNegativePricesCannotBePersistedAsSuccessfulTotals](../../../airbnb_service/src/test/java/com/pbl5cnpm/airbnb_service/spec/CreateBookingAcceptanceIT.java) | Multiple Failures (3 failures) org.opentest4j.AssertionFailedError: Q-B03 provisional 2 nights x listing price ==> expected: <1000000.0> but was: <0.0> org.opentest4j.AssertionFailedError: Q-B03 provisional 2 nights x listing price ==> expected: <100 |
| [BOOK-IT-012](03-create-booking.md) | Fail | proposal | [BOOK_IT_012_clientCannotChooseArbitraryPriceOrInfinity](../../../airbnb_service/src/test/java/com/pbl5cnpm/airbnb_service/spec/CreateBookingAcceptanceIT.java) | Multiple Failures (5 failures) org.opentest4j.AssertionFailedError: Q-B03 provisional server-computed price ==> expected: <1000000.0> but was: <1.0> org.opentest4j.AssertionFailedError: Q-B03 provisional server-computed price ==> expected: <1000000.0 |
| [BOOK-IT-013](03-create-booking.md) | Fail | proposal | [BOOK_IT_013_unavailableDeletedOrUnapprovedListingCannotBeBooked](../../../airbnb_service/src/test/java/com/pbl5cnpm/airbnb_service/spec/CreateBookingAcceptanceIT.java) | Multiple Failures (4 failures) org.opentest4j.MultipleFailuresError: Multiple Failures (2 failures) org.opentest4j.AssertionFailedError: expected: <409> but was: <200> org.opentest4j.AssertionFailedError: no booking should have been committed ==> exp |
| [BOOK-IT-014](03-create-booking.md) | Fail | proposal | [BOOK_IT_014_listingCalendarBoundary](../../../airbnb_service/src/test/java/com/pbl5cnpm/airbnb_service/spec/CreateBookingAcceptanceIT.java) | Multiple Failures (2 failures) org.opentest4j.MultipleFailuresError: Multiple Failures (2 failures) org.opentest4j.AssertionFailedError: expected: <409> but was: <200> org.opentest4j.AssertionFailedError: no booking should have been committed ==> exp |
| [BOOK-IT-015](03-create-booking.md) | Fail | proposal | [BOOK_IT_015_overlappingBookingsAndAdjacentCheckoutBoundary](../../../airbnb_service/src/test/java/com/pbl5cnpm/airbnb_service/spec/CreateBookingAcceptanceIT.java) | Multiple Failures (4 failures) org.opentest4j.MultipleFailuresError: Multiple Failures (2 failures) org.opentest4j.AssertionFailedError: expected: <409> but was: <200> org.opentest4j.AssertionFailedError: expected: <1> but was: <2> org.opentest4j.Mul |
| [BOOK-IT-016](03-create-booking.md) | Fail | proposal | [BOOK_IT_016_concurrentBookingsCannotReserveTheSameSingleSlot](../../../airbnb_service/src/test/java/com/pbl5cnpm/airbnb_service/spec/CreateBookingAcceptanceIT.java) | Multiple Failures (2 failures) org.opentest4j.AssertionFailedError: Q-B05 provisional one-slot policy ==> expected: <[200, 409]> but was: <[200, 200]> org.opentest4j.AssertionFailedError: expected: <1> but was: <2> |
| [BOOK-IT-017](03-create-booking.md) | Pass | proposal | [BOOK_IT_017_malformedEmptyAndUnsupportedMediaTypeAreRejected](../../../airbnb_service/src/test/java/com/pbl5cnpm/airbnb_service/spec/CreateBookingAcceptanceIT.java) |  |
| [BOOK-IT-018](03-create-booking.md) | Skipped | observation | [BOOK_IT_018_optionalContentRoundTripsAndUnspecifiedMaxLength](../../../airbnb_service/src/test/java/com/pbl5cnpm/airbnb_service/spec/CreateBookingAcceptanceIT.java) | Q-B08: đã kiểm tra round-trip null/rỗng/tiếng Việt; chưa chốt bắt buộc và max length. |
| [BOOK-IT-019](03-create-booking.md) | Fail | proposal | [BOOK_IT_019_lockedAccountWithPreviouslyIssuedTokenCannotBook](../../../airbnb_service/src/test/java/com/pbl5cnpm/airbnb_service/spec/CreateBookingAcceptanceIT.java) | Multiple Failures (2 failures) org.opentest4j.AssertionFailedError: expected: <true> but was: <false> org.opentest4j.AssertionFailedError: no booking should have been committed ==> expected: <0> but was: <1> |
| [BOOK-IT-020](03-create-booking.md) | Skipped | observation | [BOOK_IT_020_authenticatedHostAdminAndNoRoleUserBookingPolicy](../../../airbnb_service/src/test/java/com/pbl5cnpm/airbnb_service/spec/CreateBookingAcceptanceIT.java) | Q-B06: đã ghi nhận authenticated-only; chưa chốt role được phép đặt. |
| [BOOK-IT-021](03-create-booking.md) | Fail | proposal | [BOOK_IT_021_deletedPrincipalCannotCreateBooking](../../../airbnb_service/src/test/java/com/pbl5cnpm/airbnb_service/spec/CreateBookingAcceptanceIT.java) | HTTP status ==> expected: <401> but was: <400> |
| [BOOK-IT-022](03-create-booking.md) | Fail | proposal | [BOOK_IT_022_responseMappingFailureMustNotLeaveCommittedBooking](../../../airbnb_service/src/test/java/com/pbl5cnpm/airbnb_service/spec/CreateBookingAcceptanceIT.java) | Multiple Failures (1 failure) org.opentest4j.AssertionFailedError: expected: <true> but was: <false> |
| [BOOK-IT-023](03-create-booking.md) | Fail | proposal | [BOOK_IT_023_retryCannotCreateSecondBookingForOneLogicalRequest](../../../airbnb_service/src/test/java/com/pbl5cnpm/airbnb_service/spec/CreateBookingAcceptanceIT.java) | Q-B05/Q-B10 provisional single booking policy ==> expected: <1> but was: <2> |

## Chạy lại

Từ repo gốc:

```bash
python3 airbnb_service/scripts/run_backend_specs.py --offline
```

Bỏ `--offline` nếu cần Maven tải dependency. Script tự ghi báo cáo này từ XML mới và trả exit code Maven; kết quả Fail/Error vẫn làm lệnh thất bại. Log và XML nằm trong `airbnb_service/target/backend-spec-run.log` và `airbnb_service/target/backend-spec-reports/`.

Chỉ chạy ca đã có hợp đồng (bỏ `proposal` và `observation`):

```bash
cd airbnb_service
mvn -Pbackend-specs -DexcludedGroups=proposal,observation test
```

Lệnh Maven trực tiếp không cập nhật báo cáo Markdown. Các ca integration vẫn cần chạy lại trên MySQL/Redis cô lập trước nghiệm thu đầy đủ.
