package com.beetector.api.dtos.response;

import com.beetector.api.models.Hives;

public record HiveResponse(
        int hiveId,
        String hiveName,
        double hiveLat,
        double hiveLon,
        Integer batteryPercentage, // FIXME Change to Short when pallet stops sending null
        boolean favorite
) {
    public static HiveResponse fromEntity(Hives hives){
        return new HiveResponse(
                hives.getHiveId(),
                hives.getHiveName(),
                hives.getHiveLat(),
                hives.getHiveLon(),
                hives.getBatteryPercentage(),
                hives.isFavorite()
        );
    }
}
