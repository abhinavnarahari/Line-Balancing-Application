package com.qtech.linebalancing.operator.converter;

import com.qtech.linebalancing.operator.entity.Operator.Gender;
import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

@Converter(autoApply = true)
public class GenderConverter implements AttributeConverter<Gender, String> {

    @Override
    public String convertToDatabaseColumn(Gender gender) {
        return gender != null ? gender.name() : Gender.Female.name();
    }

    @Override
    public Gender convertToEntityAttribute(String dbData) {
        if (dbData == null || dbData.isBlank()) {
            return Gender.Female;
        }
        String val = dbData.trim().toLowerCase();
        if (val.startsWith("m")) {
            return Gender.Male;
        }
        if (val.startsWith("f")) {
            return Gender.Female;
        }
        return Gender.Other;
    }
}
