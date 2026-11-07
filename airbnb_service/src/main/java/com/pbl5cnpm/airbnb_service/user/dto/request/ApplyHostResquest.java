package com.pbl5cnpm.airbnb_service.user.dto.request;

import java.time.LocalDate;
import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import com.fasterxml.jackson.annotation.JsonSetter;

import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.experimental.FieldDefaults;

@Setter
@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class ApplyHostResquest {
    private static final Pattern NUMBER_PATTERN = Pattern.compile("(\\d+)");

    Long userId;
    String fullname;
    String country;
    String language;
    List<Long> languageIds;
    @Setter(AccessLevel.NONE)
    Integer didHostYear;
    String experience;
    String description;

    @JsonSetter("didHostYear")
    public void setDidHostYear(Object rawValue) {
        if (rawValue == null) {
            this.didHostYear = null;
            return;
        }
        if (rawValue instanceof Number number) {
            this.didHostYear = Math.max(0, number.intValue());
            return;
        }
        String text = rawValue.toString().trim();
        if (text.isEmpty()) {
            this.didHostYear = null;
            return;
        }
        try {
            this.didHostYear = Math.max(0, Integer.parseInt(text));
        } catch (NumberFormatException ex) {
            if (this.experience == null || this.experience.isBlank()) {
                this.experience = text;
            }
            this.didHostYear = extractYearsFromText(text);
        }
    }

    public static Integer extractYearsFromText(String text) {
        if (text == null || text.isBlank()) {
            return null;
        }
        Matcher matcher = NUMBER_PATTERN.matcher(text);
        if (!matcher.find()) {
            return 0;
        }
        try {
            int parsed = Integer.parseInt(matcher.group(1));
            int currentYear = LocalDate.now().getYear();
            if (parsed >= 1950 && parsed <= currentYear) {
                return Math.max(1, currentYear - parsed);
            }
            return Math.min(Math.max(parsed, 0), 80);
        } catch (NumberFormatException ex) {
            return 0;
        }
    }
}
